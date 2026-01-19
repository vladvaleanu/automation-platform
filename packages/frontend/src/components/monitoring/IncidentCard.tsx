/**
 * IncidentCard Component
 * Displays a single incident with severity badge and actions
 * Core monitoring component
 */

import { Incident } from '../../types/monitoring.types';
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
    ChatBubbleLeftRightIcon,
    ChevronDownIcon,
    XMarkIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

interface IncidentCardProps {
    incident: Incident;
    isExpanded?: boolean;
    onExpand?: () => void;
    onChatWithForge?: () => void;
    onDismiss?: () => void;
}

const severityConfig = {
    critical: {
        icon: XCircleIcon,
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        border: 'border-red-500/30',
        badge: 'bg-red-500 text-white',
        text: 'text-red-600 dark:text-red-400',
        pulse: true,
    },
    warning: {
        icon: ExclamationTriangleIcon,
        bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
        border: 'border-yellow-500/30',
        badge: 'bg-yellow-500 text-black',
        text: 'text-yellow-600 dark:text-yellow-400',
        pulse: false,
    },
    info: {
        icon: InformationCircleIcon,
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        border: 'border-blue-500/30',
        badge: 'bg-blue-500 text-white',
        text: 'text-blue-600 dark:text-blue-400',
        pulse: false,
    },
};

export function IncidentCard({
    incident,
    isExpanded = false,
    onExpand,
    onChatWithForge,
    onDismiss,
}: IncidentCardProps) {
    const config = severityConfig[incident.severity];
    const Icon = config.icon;

    return (
        <div
            className={`
        relative rounded-lg border ${config.border} ${config.bg}
        transition-all duration-200 hover:shadow-md
        ${isExpanded ? 'ring-2 ring-blue-500/50' : ''}
      `}
        >
            {/* Pulse animation for critical */}
            {config.pulse && (
                <div className="absolute inset-0 rounded-lg animate-pulse bg-red-500/5 pointer-events-none" />
            )}

            <div className="relative p-4">
                {/* Header Row */}
                <div className="flex items-start gap-3">
                    {/* Severity Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${config.badge}`}>
                        <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title & Badge */}
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {incident.title}
                            </h3>
                            {incident.hasForgeAnalysis && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full">
                                    <SparklesIcon className="h-3 w-3" />
                                    Forge
                                </span>
                            )}
                        </div>

                        {/* Impact */}
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {incident.impact}
                        </p>

                        {/* Meta Row */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <span className={config.text}>
                                {incident.alertCount} alert{incident.alertCount !== 1 ? 's' : ''}
                            </span>
                            <span>Active for {incident.duration}</span>
                        </div>
                    </div>

                    {/* Severity Badge */}
                    <span
                        className={`
              flex-shrink-0 px-2 py-1 text-xs font-bold uppercase rounded
              ${config.badge}
            `}
                    >
                        {incident.severity}
                    </span>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        onClick={onExpand}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                        <ChevronDownIcon
                            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </button>

                    <button
                        onClick={onChatWithForge}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-md transition-colors"
                    >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        Chat with Forge
                    </button>

                    <button
                        onClick={onDismiss}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors ml-auto"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Dismiss
                    </button>
                </div>

                {/* Expanded Content - Raw Alerts */}
                {isExpanded && incident.alerts && incident.alerts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Raw Alerts
                        </h4>
                        <div className="space-y-2">
                            {incident.alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="p-2 text-xs bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-gray-600 dark:text-gray-400">
                                            {alert.source}
                                        </span>
                                        <span className="text-gray-400">
                                            {alert.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 dark:text-gray-200">{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
