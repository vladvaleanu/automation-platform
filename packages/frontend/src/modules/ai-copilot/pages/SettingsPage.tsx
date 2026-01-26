import { showSuccess, showError, showInfo } from '../../../utils/toast.utils';

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowPathIcon,
    ArrowLeftIcon,
    SparklesIcon,
    CheckCircleIcon,
    CpuChipIcon,
    BoltIcon,
    UserCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { useForgeSettings } from '../../../contexts/ForgeSettingsContext';
import { DEFAULT_FORGE_SETTINGS, type ForgeSettings } from '../../../types/forge-settings';
import { Button, Input, Select, FormField, Card } from '../../../components/ui';
import { useConfirm } from '../../../hooks/useConfirm';
import ConfirmModal from '../../../components/ConfirmModal';

export function SettingsPage() {
    const { settings, isLoaded, saveSettings, resetSettings } = useForgeSettings();
    const [localSettings, setLocalSettings] = useState<ForgeSettings>(DEFAULT_FORGE_SETTINGS);
    const [isSaved, setIsSaved] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Confirm modal state
    const {
        confirmState,
        confirm,
        handleConfirm,
        handleClose
    } = useConfirm();

    // Sync local state when settings load from localStorage
    useEffect(() => {
        if (isLoaded) {
            setLocalSettings(settings);
        }
    }, [isLoaded, settings]);

    const handleChange = <K extends keyof ForgeSettings>(
        key: K,
        value: ForgeSettings[K]
    ) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setIsSaved(false);
    };

    const handleSave = () => {
        try {
            saveSettings(localSettings);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            showSuccess('Forge AI settings saved');
        } catch (err) {
            showError('Failed to save settings');
        }
    };

    const handleReset = () => {
        confirm(
            async () => {
                resetSettings();
                setLocalSettings(DEFAULT_FORGE_SETTINGS);
                showInfo('Settings reset to defaults');
            },
            {
                title: 'Reset Settings',
                message: 'Are you sure you want to reset all settings to default?',
                confirmText: 'Reset',
                variant: 'danger',
            }
        );
    };

    const handleTestConnection = () => {
        setIsTesting(true);
        // Mock test - always succeeds after 1s
        setTimeout(() => {
            setIsTesting(false);
            showSuccess('Connection successful! (Mock: Phase 2 will test real Ollama)');
        }, 1000);
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-full">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/modules/ai-copilot"
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                <SparklesIcon className="h-4 w-4 text-white" />
                            </div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                Forge Settings
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Reset to Defaults
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            {isSaved ? (
                                <>
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Saved!
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Form */}
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Section 1: AI Brain */}
                <SettingsSection
                    icon={<CpuChipIcon className="h-5 w-5" />}
                    title="AI Brain (Generation)"
                    description="Configure the LLM provider for Forge's responses"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Provider Engine">
                            <Select
                                value={localSettings.provider}
                                onChange={e => handleChange('provider', e.target.value as ForgeSettings['provider'])}
                            >
                                <option value="ollama">Ollama</option>
                                <option value="localai">LocalAI</option>
                                <option value="openai-compatible">OpenAI-Compatible</option>
                            </Select>
                        </FormField>

                        <FormField label="API Endpoint">
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={localSettings.baseUrl}
                                    onChange={e => handleChange('baseUrl', e.target.value)}
                                    placeholder="http://localhost:11434"
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleTestConnection}
                                    disabled={isTesting}
                                    variant="secondary"
                                >
                                    {isTesting ? 'Testing...' : 'Test'}
                                </Button>
                            </div>
                        </FormField>

                        <FormField label="Chat Model">
                            <Input
                                type="text"
                                value={localSettings.model}
                                onChange={e => handleChange('model', e.target.value)}
                                placeholder="llama3.1"
                            />
                        </FormField>

                        <FormField label="Context Window">
                            <Input
                                type="number"
                                value={localSettings.contextWindow}
                                onChange={e => handleChange('contextWindow', parseInt(e.target.value) || 8192)}
                                min={1024}
                                max={128000}
                                step={1024}
                            />
                        </FormField>
                    </div>
                </SettingsSection>

                {/* Section 2: Embeddings */}
                <SettingsSection
                    icon={<BoltIcon className="h-5 w-5" />}
                    title="Long-Term Memory (Embeddings)"
                    description="Configure vector embeddings for RAG. Requires re-indexing if changed."
                    warning
                >
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Embedding Provider">
                            <Select
                                value={localSettings.embeddingProvider}
                                onChange={e => handleChange('embeddingProvider', e.target.value as ForgeSettings['embeddingProvider'])}
                            >
                                <option value="same">Same as Generation</option>
                                <option value="nomic-embed-text">nomic-embed-text</option>
                                <option value="mxbai-embed-large">mxbai-embed-large</option>
                            </Select>
                        </FormField>

                        <FormField label="Embedding Model">
                            <Input
                                type="text"
                                value={localSettings.embeddingModel}
                                onChange={e => handleChange('embeddingModel', e.target.value)}
                                placeholder="nomic-embed-text"
                            />
                        </FormField>
                    </div>
                </SettingsSection>

                {/* Section 3: Personality */}
                <SettingsSection
                    icon={<UserCircleIcon className="h-5 w-5" />}
                    title="Personality & Strictness"
                    description="Control Forge's behavior and communication style"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Persona Name">
                                <Input
                                    type="text"
                                    value={localSettings.personaName}
                                    onChange={e => handleChange('personaName', e.target.value)}
                                    placeholder="Forge"
                                />
                            </FormField>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Strictness Level: {localSettings.strictness}
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={localSettings.strictness}
                                    onChange={e => handleChange('strictness', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>1 - Helpful</span>
                                    <span>5 - Balanced</span>
                                    <span>10 - Military Strict</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Infrastructure Priority
                            </label>
                            <div className="flex items-center gap-6">
                                {(['power', 'cooling', 'access'] as const).map(key => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.infrastructurePriority[key]}
                                            onChange={e =>
                                                handleChange('infrastructurePriority', {
                                                    ...localSettings.infrastructurePriority,
                                                    [key]: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                            {key}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* Section 4: Batching */}
                <SettingsSection
                    icon={<ClockIcon className="h-5 w-5" />}
                    title="Alert Batching"
                    description="Configure how alerts are grouped into incidents"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Batch Window (seconds)" helpText="Time to wait before analyzing grouped alerts">
                            <Input
                                type="number"
                                value={localSettings.batchWindowSeconds}
                                onChange={e => handleChange('batchWindowSeconds', parseInt(e.target.value) || 30)}
                                min={5}
                                max={300}
                            />
                        </FormField>

                        <FormField label="Min Alerts for Incident" helpText="Minimum alerts needed to create an incident">
                            <Input
                                type="number"
                                value={localSettings.minAlertsForIncident}
                                onChange={e => handleChange('minAlertsForIncident', parseInt(e.target.value) || 5)}
                                min={1}
                                max={50}
                            />
                        </FormField>
                    </div>
                </SettingsSection>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                variant={confirmState.variant}
                isLoading={confirmState.isLoading}
            />
        </div>
    );
}

// Settings section wrapper component
function SettingsSection({
    icon,
    title,
    description,
    warning,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    warning?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Card noPadding className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="text-purple-600 dark:text-purple-400">{icon}</div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {description}
                            {warning && (
                                <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                                    ⚠️ Requires re-indexing
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
            <div className="px-6 py-4">{children}</div>
        </Card>
    );
}

export default SettingsPage;
