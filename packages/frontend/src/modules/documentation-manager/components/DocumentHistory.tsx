
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    ClockIcon,
    ArrowPathIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { documentsApi } from '../api/docs.api';
import { showSuccess, showError } from '../../../utils/toast.utils';
import { DiffViewer } from './DiffViewer';
import ConfirmModal from '../../../components/ConfirmModal';

interface DocumentHistoryProps {
    documentId: string;
    onClose: () => void;
    onRestore: () => void;
}

export function DocumentHistory({ documentId, onClose, onRestore }: DocumentHistoryProps) {
    const queryClient = useQueryClient();
    const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

    const { data: versionsResponse, isLoading } = useQuery({
        queryKey: ['docs-versions', documentId],
        queryFn: () => documentsApi.getVersions(documentId),
    });

    const versions = versionsResponse?.data || [];

    // Fetch content for expanded version
    const { data: currentVersionData } = useQuery({
        queryKey: ['docs-version', documentId, expandedVersion],
        queryFn: () => documentsApi.getVersion(documentId, expandedVersion!),
        enabled: !!expandedVersion,
    });

    // Calculate previous version number
    const currentVersionIndex = versions.findIndex(v => v.version === expandedVersion);
    const previousVersion = currentVersionIndex !== -1 && currentVersionIndex < versions.length - 1
        ? versions[currentVersionIndex + 1]
        : null;

    // Fetch content for previous version
    const { data: previousVersionData } = useQuery({
        queryKey: ['docs-version', documentId, previousVersion?.version],
        queryFn: () => documentsApi.getVersion(documentId, previousVersion!.version),
        enabled: !!previousVersion && !!expandedVersion,
    });

    const restoreMutation = useMutation({
        mutationFn: ({ version }: { version: number }) =>
            documentsApi.restoreVersion(documentId, version),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['docs-document', documentId] });
            queryClient.invalidateQueries({ queryKey: ['docs-versions', documentId] });
            onRestore();
            onClose();
            showSuccess('Version restored successfully');
        },
        onError: (error: Error) => {
            showError(`Failed to restore version: ${error.message}`);
        }
    });

    const [confirmRestore, setConfirmRestore] = useState<number | null>(null);

    const handleRestore = (version: number) => {
        setConfirmRestore(version);
    };

    const executeRestore = () => {
        if (confirmRestore !== null) {
            restoreMutation.mutate({ version: confirmRestore });
            setConfirmRestore(null);
        }
    };

    const toggleExpand = (version: number) => {
        if (expandedVersion === version) {
            setExpandedVersion(null);
        } else {
            setExpandedVersion(version);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            Version History
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : versions.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No version history available.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {versions.map((version) => (
                                <div
                                    key={version.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                        <div
                                            className="flex-1 cursor-pointer flex items-center gap-4"
                                            onClick={() => toggleExpand(version.version)}
                                        >
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                                {expandedVersion === version.version ? (
                                                    <ChevronUpIcon className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDownIcon className="h-5 w-5" />
                                                )}
                                            </button>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                        Version {version.version}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {format(new Date(version.created_at), 'PPP p')}
                                                    </span>
                                                </div>
                                                {version.change_note ? (
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {version.change_note}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                        No change note
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <span>By {version.author?.username || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleRestore(version.version)}
                                            disabled={restoreMutation.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 ml-4"
                                        >
                                            <ArrowPathIcon className="h-4 w-4" />
                                            Restore
                                        </button>
                                    </div>

                                    {/* Diff View */}
                                    {expandedVersion === version.version && (
                                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Changes from {previousVersion ? `Version ${previousVersion.version}` : 'start'}
                                            </h3>
                                            {currentVersionData?.data && (
                                                <div className="space-y-4">
                                                    {/* Title Change */}
                                                    {(currentVersionData.data.title !== (previousVersionData?.data?.title || '')) && (
                                                        <div className="mb-4">
                                                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                                                Title Change
                                                            </h4>
                                                            <div className="flex items-center gap-3 text-sm">
                                                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded line-through">
                                                                    {previousVersionData?.data?.title || '(empty)'}
                                                                </span>
                                                                <span className="text-gray-400">→</span>
                                                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                                                    {currentVersionData.data.title}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Content Diff */}
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                                            Content Changes
                                                        </h4>
                                                        <DiffViewer
                                                            oldValue={previousVersionData?.data?.content || ''}
                                                            newValue={currentVersionData.data.content || ''}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {!currentVersionData?.data && (
                                                <div className="flex justify-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Restore Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmRestore !== null}
                title="Restore Version"
                message={`Are you sure you want to restore version ${confirmRestore}? This will create a new version with the content from version ${confirmRestore}.`}
                confirmText="Restore"
                variant="info"
                onConfirm={executeRestore}
                onClose={() => setConfirmRestore(null)}
            />
        </div>
    );
}
