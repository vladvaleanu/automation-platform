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

export function SettingsPage() {
    const { settings, isLoaded, saveSettings, resetSettings } = useForgeSettings();
    const [localSettings, setLocalSettings] = useState<ForgeSettings>(DEFAULT_FORGE_SETTINGS);
    const [isSaved, setIsSaved] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

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
        if (confirm('Are you sure you want to reset all settings to default?')) {
            resetSettings();
            setLocalSettings(DEFAULT_FORGE_SETTINGS);
            showInfo('Settings reset to defaults');
        }
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Provider Engine
                            </label>
                            <select
                                value={localSettings.provider}
                                onChange={e => handleChange('provider', e.target.value as ForgeSettings['provider'])}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="ollama">Ollama</option>
                                <option value="localai">LocalAI</option>
                                <option value="openai-compatible">OpenAI-Compatible</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                API Endpoint
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={localSettings.baseUrl}
                                    onChange={e => handleChange('baseUrl', e.target.value)}
                                    placeholder="http://localhost:11434"
                                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleTestConnection}
                                    disabled={isTesting}
                                    className="px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-300 dark:border-purple-500/50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isTesting ? 'Testing...' : 'Test'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Chat Model
                            </label>
                            <input
                                type="text"
                                value={localSettings.model}
                                onChange={e => handleChange('model', e.target.value)}
                                placeholder="llama3.1"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Context Window
                            </label>
                            <input
                                type="number"
                                value={localSettings.contextWindow}
                                onChange={e => handleChange('contextWindow', parseInt(e.target.value) || 8192)}
                                min={1024}
                                max={128000}
                                step={1024}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Embedding Provider
                            </label>
                            <select
                                value={localSettings.embeddingProvider}
                                onChange={e => handleChange('embeddingProvider', e.target.value as ForgeSettings['embeddingProvider'])}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="same">Same as Generation</option>
                                <option value="nomic-embed-text">nomic-embed-text</option>
                                <option value="mxbai-embed-large">mxbai-embed-large</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Embedding Model
                            </label>
                            <input
                                type="text"
                                value={localSettings.embeddingModel}
                                onChange={e => handleChange('embeddingModel', e.target.value)}
                                placeholder="nomic-embed-text"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Persona Name
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.personaName}
                                    onChange={e => handleChange('personaName', e.target.value)}
                                    placeholder="Forge"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Batch Window (seconds)
                            </label>
                            <input
                                type="number"
                                value={localSettings.batchWindowSeconds}
                                onChange={e => handleChange('batchWindowSeconds', parseInt(e.target.value) || 30)}
                                min={5}
                                max={300}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Time to wait before analyzing grouped alerts
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Min Alerts for Incident
                            </label>
                            <input
                                type="number"
                                value={localSettings.minAlertsForIncident}
                                onChange={e => handleChange('minAlertsForIncident', parseInt(e.target.value) || 5)}
                                min={1}
                                max={50}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Minimum alerts needed to create an incident
                            </p>
                        </div>
                    </div>
                </SettingsSection>
            </div>
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
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
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
        </div>
    );
}

export default SettingsPage;
