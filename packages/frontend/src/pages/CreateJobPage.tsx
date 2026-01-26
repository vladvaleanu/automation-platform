/**
 * Create Job Page - Form to create new automation jobs
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { modulesApi } from '../api/modules';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/error.utils';
import { showError, showSuccess } from '../utils/toast.utils';
import { PageHeader, Card, Button, Select, Input, Textarea, FormField, LoadingState } from '../components/ui';

interface Module {
  id: string;
  name: string;
  description?: string;
  status?: string;
  manifest: {
    jobs?: Record<string, {
      name: string;
      handler: string;
      description?: string;
      schedule?: string | null;
      timeout?: number;
      retries?: number;
      config?: Record<string, any>;
    }>;
  };
}

const cronPresets = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at noon', value: '0 12 * * *' },
  { label: 'Every Monday at 9am', value: '0 9 * * 1' },
  { label: 'Manual (no schedule)', value: '' },
];

export default function CreateJobPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    moduleId: '',
    handler: '',
    schedule: '',
    enabled: true,
    timeout: 300000,
    retries: 3,
    config: '{}',
  });
  const [showCronBuilder, setShowCronBuilder] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedModuleHandlers, setSelectedModuleHandlers] = useState<any[]>([]);

  // Fetch modules - only when authenticated to avoid race conditions
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: () => modulesApi.list(),
    enabled: isAuthenticated && !authLoading,
    staleTime: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const modules: Module[] = (modulesData || []).filter((m: Module) => m.status === 'ENABLED');

  // Show loading state while auth is being verified
  if (authLoading) {
    return <LoadingState text="Verifying authentication..." />;
  }

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/jobs', data),
    onSuccess: () => {
      showSuccess('Job created successfully');
      navigate('/jobs');
    },
    onError: (error: any) => {
      showError(`Failed to create job: ${getErrorMessage(error)}`);
    },
  });

  const handleModuleChange = (moduleId: string) => {
    setFormData({ ...formData, moduleId, handler: '' });
    const module = modules.find(m => m.id === moduleId);

    // Transform jobs object to array for UI
    const handlers = module?.manifest?.jobs
      ? Object.entries(module.manifest.jobs).map(([key, job]) => ({
        ...job,
        key, // Keep the job key for reference
      }))
      : [];

    setSelectedModuleHandlers(handlers);
  };

  const handleHandlerChange = (handler: string) => {
    setFormData({ ...formData, handler });

    // Auto-fill from manifest if available
    const jobDef = selectedModuleHandlers.find(j => j.handler === handler);
    if (jobDef) {
      setFormData(prev => ({
        ...prev,
        handler,
        name: prev.name || jobDef.name,
        description: prev.description || jobDef.description || '',
        schedule: prev.schedule || jobDef.schedule || '',
        timeout: prev.timeout || jobDef.timeout || 300000,
        retries: prev.retries !== undefined ? prev.retries : (jobDef.retries !== undefined ? jobDef.retries : 3),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate config JSON
    try {
      JSON.parse(formData.config);
    } catch (err) {
      showError('Invalid JSON in config field');
      return;
    }

    const payload = {
      ...formData,
      config: formData.config ? JSON.parse(formData.config) : {},
      schedule: formData.schedule || undefined,
    };

    createJobMutation.mutate(payload);
  };

  return (
    <div className="p-8">

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Create Job"
          description="Create a new automation job"
        />

        {/* No Modules Warning */}
        {!modulesLoading && modules.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
              No Modules Available
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
              You need to register and enable at least one module before creating jobs.
            </p>
            <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
              <p><strong>To get started:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to the <a href="/modules" className="underline font-medium">Modules page</a></li>
                <li>Register a new module with a manifest that includes job definitions</li>
                <li>Enable the module</li>
                <li>Return here to create jobs</li>
              </ol>
            </div>
          </div>
        )}

        {/* Form */}
        {modules.length > 0 && (
          <form onSubmit={handleSubmit}>
            <Card className="space-y-6">
              {/* Module Selection */}
              <FormField label="Module" required>
                <Select
                  value={formData.moduleId}
                  onChange={(e) => handleModuleChange(e.target.value)}
                  required
                  disabled={modulesLoading}
                >
                  <option value="">Select a module...</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Job Type Selection */}
              {formData.moduleId && (
                <FormField label="Job Type" required>
                  {selectedModuleHandlers.length > 0 ? (
                    <>
                      <Select
                        value={formData.handler}
                        onChange={(e) => handleHandlerChange(e.target.value)}
                        required
                      >
                        <option value="">Select a job type...</option>
                        {selectedModuleHandlers.map((job, idx) => (
                          <option key={idx} value={job.handler}>
                            {job.name}
                          </option>
                        ))}
                      </Select>
                      {formData.handler && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {selectedModuleHandlers.find(j => j.handler === formData.handler)?.description || 'No description available'}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Input
                        type="text"
                        value={formData.handler}
                        onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
                        placeholder="e.g., jobs/monitor.js"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        This module doesn't have predefined jobs. Enter the path to your job handler file.
                      </p>
                    </>
                  )}
                </FormField>
              )}

              {/* Job Name */}
              <FormField label="Job Name" required>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Automation Job"
                  required
                />
              </FormField>

              {/* Description */}
              <FormField label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this job do?"
                  rows={3}
                />
              </FormField>

              {/* Schedule */}
              <FormField
                label="Schedule (Cron Expression)"
                helpText="Leave empty for manual execution only. Format: minute hour day month weekday"
              >
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={formData.schedule}
                      onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                      placeholder="* * * * * (or leave empty for manual only)"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowCronBuilder(!showCronBuilder)}
                      variant="secondary"
                    >
                      {showCronBuilder ? 'Hide' : 'Presets'}
                    </Button>
                  </div>
                  {showCronBuilder && (
                    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                      {cronPresets.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, schedule: preset.value })}
                          variant="secondary"
                          size="sm"
                          className="text-left justify-start"
                        >
                          <div>
                            <div className="font-medium">{preset.label}</div>
                            {preset.value && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {preset.value}
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </FormField>

              {/* Advanced Settings Toggle */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>{showAdvanced ? '▼' : '▶'}</span>
                  <span className="ml-2">Advanced Settings</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(optional)</span>
                </button>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <div className="space-y-6 pl-4 border-l-2 border-blue-500">
                  {/* Timeout */}
                  <FormField label="Timeout" helpText="Maximum time the job can run (default: 300 seconds / 5 minutes)">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={formData.timeout / 1000}
                        onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) * 1000 })}
                        min="1"
                        step="1"
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">seconds</span>
                    </div>
                  </FormField>

                  {/* Retries */}
                  <FormField label="Retry Attempts" helpText="How many times to retry if the job fails (0-10, default: 3)">
                    <Input
                      type="number"
                      value={formData.retries}
                      onChange={(e) => setFormData({ ...formData, retries: parseInt(e.target.value) })}
                      min="0"
                      max="10"
                      className="w-32"
                    />
                  </FormField>

                  {/* Config */}
                  <FormField label="Custom Configuration (JSON)" helpText="Job-specific configuration in JSON format (optional)">
                    <Textarea
                      value={formData.config}
                      onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                      placeholder='{"apiKey": "xxx", "endpoint": "https://..."}&#10;&#10;Optional: Add job-specific settings here'
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </FormField>
                </div>
              )}

              {/* Enabled */}
              <div className="flex items-center pt-4">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable and start scheduling immediately after creation
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  onClick={() => navigate('/jobs')}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createJobMutation.isPending}
                  isLoading={createJobMutation.isPending}
                >
                  Create Job
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>

    </div>
  );
}
