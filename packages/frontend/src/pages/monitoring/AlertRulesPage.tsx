/**
 * Alert Rules Page
 * Configure alert rules that trigger when events match conditions
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    PlusIcon,
    BellAlertIcon,
    TrashIcon,
    PencilSquareIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { alertRulesApi, type AlertRule, type AlertCondition, type AlertRuleRequest, type EventSource } from '../../modules/ai-copilot/api';
import { Button, Badge, Card, Modal, ModalFooter, PageHeader, LoadingState, EmptyState, Input, Select, FormField } from '../../components/ui';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmModal from '../../components/ConfirmModal';

// Severity badge colors mapping to our Badge component variants
const severityVariantMap: Record<string, 'error' | 'warning' | 'info'> = {
    critical: 'error',
    warning: 'warning',
    info: 'info',
};

// Operator display names
const operatorLabels: Record<string, string> = {
    eq: 'equals',
    ne: 'not equals',
    gt: 'greater than',
    lt: 'less than',
    gte: '≥',
    lte: '≤',
    contains: 'contains',
    not_contains: 'not contains',
};

export default function AlertRulesPage() {
    const queryClient = useQueryClient();
    const { confirm, confirmState, handleConfirm, handleClose } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

    // Fetch rules
    const { data, isLoading, error } = useQuery({
        queryKey: ['alert-rules'],
        queryFn: () => alertRulesApi.getRules(),
    });

    // Fetch sources for dropdown
    const { data: sourcesData } = useQuery({
        queryKey: ['alert-sources'],
        queryFn: () => alertRulesApi.getSources(),
    });

    // Toggle mutation
    const toggleMutation = useMutation({
        mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
            alertRulesApi.toggleRule(id, enabled),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-rules'] }),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => alertRulesApi.deleteRule(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-rules'] }),
    });

    const handleEdit = (rule: AlertRule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const handleDelete = (rule: AlertRule) => {
        confirm(
            async () => { await deleteMutation.mutateAsync(rule.id); },
            {
                title: 'Delete Alert Rule',
                message: `Are you sure you want to delete "${rule.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                variant: 'danger',
            }
        );
    };

    const rules = data?.rules || [];
    const sources = sourcesData?.sources || [];

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 p-6 overflow-hidden">
            <PageHeader
                title="Alert Rules"
                description="Configure rules that trigger alerts when events match your specified conditions"
                icon={
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <BellAlertIcon className="h-5 w-5 text-white" />
                    </div>
                }
                actions={
                    <Button onClick={handleAdd} leftIcon={<PlusIcon className="h-5 w-5" />}>
                        Add Rule
                    </Button>
                }
            />

            {/* Page Content */}
            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Loading state */}
                {isLoading && (
                    <Card>
                        <LoadingState text="Loading rules..." />
                    </Card>
                )}

                {/* Error state */}
                {error && (
                    <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <ExclamationTriangleIcon className="h-5 w-5" />
                            <span>Failed to load alert rules</span>
                        </div>
                    </Card>
                )}

                {/* Empty state */}
                {!isLoading && !error && rules.length === 0 && (
                    <Card>
                        <EmptyState
                            icon={<BellAlertIcon className="h-16 w-16" />}
                            title="No alert rules configured"
                            description="Create rules to automatically generate alerts when events match your conditions."
                            action={{ label: 'Create First Rule', onClick: handleAdd }}
                        />
                    </Card>
                )}

                {/* Rules list */}
                {/* Rules list */}
                {!isLoading && rules.length > 0 && (
                    <Card noPadding className="overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Enabled
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Conditions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Severity
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                {rule.name}
                                            </div>
                                            {rule.description && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                    {rule.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {rule.source === '*' ? 'All Sources' : rule.source}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {rule.conditions.length === 0 ? (
                                                    <span className="text-sm text-gray-400">No conditions</span>
                                                ) : (
                                                    rule.conditions.slice(0, 2).map((c, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700/50 rounded text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                                        >
                                                            {c.field} {operatorLabels[c.operator] || c.operator} {c.value}
                                                        </span>
                                                    ))
                                                )}
                                                {rule.conditions.length > 2 && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                        +{rule.conditions.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={severityVariantMap[rule.severity] || 'neutral'}>
                                                {rule.severity}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="xs" variant="ghost" onClick={() => handleEdit(rule)}>
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </Button>
                                                <Button size="xs" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(rule)}>
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}
            </div>

            {/* Rule Editor Modal */}
            {isModalOpen && (
                <RuleEditorModal
                    rule={editingRule}
                    sources={sources}
                    onClose={() => setIsModalOpen(false)}
                    onSaved={() => {
                        setIsModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
                    }}
                />
            )}
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                variant={confirmState.variant}
                isLoading={confirmState.isLoading}
            />
        </div>
    );
}

// Rule Editor Modal Component
function RuleEditorModal({
    rule,
    sources,
    onClose,
    onSaved,
}: {
    rule: AlertRule | null;
    sources: EventSource[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const isEditing = !!rule;

    // Basic fields
    const [name, setName] = useState(rule?.name || '');
    const [description, setDescription] = useState(rule?.description || '');
    const [source, setSource] = useState(rule?.source || '*');
    const [eventType, setEventType] = useState(rule?.eventType || '*');
    const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>(rule?.severity || 'warning');
    const [conditions, setConditions] = useState<AlertCondition[]>(rule?.conditions || []);
    const [conditionLogic, setConditionLogic] = useState<'AND' | 'OR'>(rule?.conditionLogic || 'AND');
    const [cooldownSeconds, setCooldownSeconds] = useState(rule?.cooldownSeconds || 60);

    // Time window
    const [timeWindowEnabled, setTimeWindowEnabled] = useState(rule?.timeWindow?.enabled || false);
    const [timeWindowStart, setTimeWindowStart] = useState(rule?.timeWindow?.start || '08:00');
    const [timeWindowEnd, setTimeWindowEnd] = useState(rule?.timeWindow?.end || '18:00');
    const [timeWindowDays, setTimeWindowDays] = useState<number[]>(rule?.timeWindow?.days || [1, 2, 3, 4, 5]);

    // Rate limiting
    const [rateLimitEnabled, setRateLimitEnabled] = useState(rule?.rateLimit?.enabled || false);
    const [rateLimitCount, setRateLimitCount] = useState(rule?.rateLimit?.count || 5);
    const [rateLimitWindowSeconds, setRateLimitWindowSeconds] = useState(rule?.rateLimit?.windowSeconds || 300);

    // Escalation
    const [escalationEnabled, setEscalationEnabled] = useState(rule?.escalation?.enabled || false);
    const [escalationAfterMinutes, setEscalationAfterMinutes] = useState(rule?.escalation?.afterMinutes || 30);
    const [escalationToSeverity, setEscalationToSeverity] = useState<'critical' | 'warning' | 'info'>(
        rule?.escalation?.toSeverity || 'critical'
    );

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const toggleDay = (day: number) => {
        if (timeWindowDays.includes(day)) {
            setTimeWindowDays(timeWindowDays.filter((d) => d !== day));
        } else {
            setTimeWindowDays([...timeWindowDays, day].sort());
        }
    };

    const addCondition = () => {
        setConditions([...conditions, { field: '', operator: 'eq', value: '' }]);
    };

    const removeCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index: number, updates: Partial<AlertCondition>) => {
        setConditions(conditions.map((c, i) => (i === index ? { ...c, ...updates } : c)));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const payload: AlertRuleRequest = {
                name: name.trim(),
                description: description.trim() || undefined,
                source,
                eventType,
                severity,
                conditions: conditions.filter((c) => c.field.trim()),
                conditionLogic,
                cooldownSeconds,
                // Time window
                timeWindowEnabled,
                timeWindowStart: timeWindowEnabled ? timeWindowStart : undefined,
                timeWindowEnd: timeWindowEnabled ? timeWindowEnd : undefined,
                timeWindowDays: timeWindowEnabled ? timeWindowDays : undefined,
                // Rate limiting
                rateLimitEnabled,
                rateLimitCount: rateLimitEnabled ? rateLimitCount : undefined,
                rateLimitWindowSeconds: rateLimitEnabled ? rateLimitWindowSeconds : undefined,
                // Escalation
                escalationEnabled,
                escalationAfterMinutes: escalationEnabled ? escalationAfterMinutes : undefined,
                escalationToSeverity: escalationEnabled ? escalationToSeverity : undefined,
            };

            if (isEditing) {
                await alertRulesApi.updateRule(rule!.id, payload);
            } else {
                await alertRulesApi.createRule(payload);
            }

            onSaved();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save rule');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={isEditing ? 'Edit Alert Rule' : 'Create Alert Rule'}
            size="2xl"
        >
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'basic'
                            ? 'text-purple-600 border-purple-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Basic Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('advanced')}
                        className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'advanced'
                            ? 'text-purple-600 border-purple-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Advanced Settings
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {activeTab === 'basic' && (
                        <>
                            {/* Name */}
                            <FormField label="Rule Name" required>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., High Power Usage Alert"
                                />
                            </FormField>

                            {/* Description */}
                            <FormField label="Description">
                                <Input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                />
                            </FormField>

                            {/* Source & Event Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Event Source">
                                    <Select
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                    >
                                        {sources.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                                <FormField label="Event Type">
                                    <Select
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value)}
                                    >
                                        <option value="*">All Types</option>
                                        <option value="metric.collected">Metric Collected</option>
                                        <option value="error">Error</option>
                                        <option value="job.failed">Job Failed</option>
                                        <option value="job.completed">Job Completed</option>
                                        <option value="module.loaded">Module Loaded</option>
                                    </Select>
                                </FormField>
                            </div>

                            {/* Severity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Alert Severity
                                </label>
                                <div className="flex gap-4">
                                    {(['critical', 'warning', 'info'] as const).map((s) => (
                                        <label key={s} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="severity"
                                                value={s}
                                                checked={severity === s}
                                                onChange={() => setSeverity(s)}
                                                className="text-purple-600"
                                            />
                                            <Badge variant={severityVariantMap[s] || 'neutral'}>
                                                {s}
                                            </Badge>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Condition Logic */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Condition Logic
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="conditionLogic"
                                            value="AND"
                                            checked={conditionLogic === 'AND'}
                                            onChange={() => setConditionLogic('AND')}
                                            className="text-purple-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            AND (all conditions must match)
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="conditionLogic"
                                            value="OR"
                                            checked={conditionLogic === 'OR'}
                                            onChange={() => setConditionLogic('OR')}
                                            className="text-purple-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            OR (any condition matches)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Conditions */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Conditions
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addCondition}
                                        className="text-sm text-purple-600 hover:text-purple-700"
                                    >
                                        + Add Condition
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {conditions.map((condition, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    type="text"
                                                    value={condition.field}
                                                    onChange={(e) => updateCondition(index, { field: e.target.value })}
                                                    placeholder="Field (e.g., power)"
                                                />
                                            </div>
                                            <Select
                                                value={condition.operator}
                                                onChange={(e) =>
                                                    updateCondition(index, { operator: e.target.value as AlertCondition['operator'] })
                                                }
                                                className="w-auto"
                                            >
                                                <option value="eq">=</option>
                                                <option value="ne">≠</option>
                                                <option value="gt">&gt;</option>
                                                <option value="lt">&lt;</option>
                                                <option value="gte">≥</option>
                                                <option value="lte">≤</option>
                                                <option value="contains">contains</option>
                                                <option value="not_contains">not contains</option>
                                            </Select>
                                            <div className="w-32">
                                                <Input
                                                    type="text"
                                                    value={condition.value}
                                                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                                                    placeholder="Value"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCondition(index)}
                                                className="p-2 text-gray-400 hover:text-red-500"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {conditions.length === 0 && (
                                        <p className="text-sm text-gray-400 italic">
                                            No conditions - rule will match all events from the selected source
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Cooldown */}
                            <FormField label="Cooldown (seconds)" helpText="Minimum time between alerts from this rule">
                                <Input
                                    type="number"
                                    value={cooldownSeconds}
                                    onChange={(e) => setCooldownSeconds(parseInt(e.target.value) || 60)}
                                    min={0}
                                    className="w-32"
                                />
                            </FormField>
                        </>
                    )}

                    {activeTab === 'advanced' && (
                        <>
                            {/* Time Window */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={timeWindowEnabled}
                                        onChange={(e) => setTimeWindowEnabled(e.target.checked)}
                                        className="text-purple-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Time Window (only active during specific times)
                                    </span>
                                </label>

                                {timeWindowEnabled && (
                                    <div className="pl-6 space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                                                <Input
                                                    type="time"
                                                    value={timeWindowStart}
                                                    onChange={(e) => setTimeWindowStart(e.target.value)}
                                                    className="py-1.5 text-sm"
                                                />
                                            </div>
                                            <span className="text-gray-500">to</span>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">End Time</label>
                                                <Input
                                                    type="time"
                                                    value={timeWindowEnd}
                                                    onChange={(e) => setTimeWindowEnd(e.target.value)}
                                                    className="py-1.5 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-2">Active Days</label>
                                            <div className="flex gap-2">
                                                {dayLabels.map((label, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => toggleDay(i + 1)}
                                                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${timeWindowDays.includes(i + 1)
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Rate Limiting */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rateLimitEnabled}
                                        onChange={(e) => setRateLimitEnabled(e.target.checked)}
                                        className="text-purple-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Rate Limiting (limit triggers per time window)
                                    </span>
                                </label>

                                {rateLimitEnabled && (
                                    <div className="pl-6 flex items-center gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Max Triggers</label>
                                            <Input
                                                type="number"
                                                value={rateLimitCount}
                                                onChange={(e) => setRateLimitCount(parseInt(e.target.value) || 5)}
                                                min={1}
                                                className="w-20 py-1.5 text-sm"
                                            />
                                        </div>
                                        <span className="text-gray-500">in</span>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Window (seconds)</label>
                                            <Input
                                                type="number"
                                                value={rateLimitWindowSeconds}
                                                onChange={(e) => setRateLimitWindowSeconds(parseInt(e.target.value) || 300)}
                                                min={60}
                                                className="w-32 py-1.5 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Escalation */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={escalationEnabled}
                                        onChange={(e) => setEscalationEnabled(e.target.checked)}
                                        className="text-purple-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Auto-Escalate (if not acknowledged)
                                    </span>
                                </label>

                                {escalationEnabled && (
                                    <div className="pl-6 flex items-center gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Escalate After (minutes)</label>
                                            <Input
                                                type="number"
                                                value={escalationAfterMinutes}
                                                onChange={(e) => setEscalationAfterMinutes(parseInt(e.target.value) || 30)}
                                                min={1}
                                                className="w-32 py-1.5 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Escalate To</label>
                                            <Select
                                                value={escalationToSeverity}
                                                onChange={(e) =>
                                                    setEscalationToSeverity(e.target.value as 'critical' | 'warning' | 'info')
                                                }
                                                className="py-1.5 text-sm"
                                            >
                                                <option value="critical">Critical</option>
                                                <option value="warning">Warning</option>
                                                <option value="info">Info</option>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
                        {isEditing ? 'Save Changes' : 'Create Rule'}
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
}
