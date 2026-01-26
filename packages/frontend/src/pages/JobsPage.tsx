/**
 * Jobs Page - List and manage automation jobs
 */

import { useState, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getErrorMessage } from '../utils/error.utils';
import { showError, showSuccess } from '../utils/toast.utils';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';
import { Button, Card, PageHeader, Badge, EmptyState, LoadingState } from '../components/ui';
import { BriefcaseIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

interface Job {
  id: string;
  name: string;
  description?: string;
  moduleId: string;
  module?: {
    name: string;
    displayName: string;
  };
  handler: string;
  schedule?: string;
  enabled: boolean;
  timeout: number;
  retries: number;
  config?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface JobRowProps {
  job: Job;
  onExecute: (jobId: string, jobName: string) => void;
  onToggle: (job: Job) => void;
  onDelete: (jobId: string, jobName: string) => void;
}

const JobRow = memo(({ job, onExecute, onToggle, onDelete }: JobRowProps) => {
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {job.name}
        </div>
        {job.description && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {job.description}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {job.module?.name || job.moduleId}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {job.schedule || 'Manual'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={job.enabled ? 'success' : 'neutral'}>
          {job.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExecute(job.id, job.name)}
          disabled={!job.enabled}
        >
          Run
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(job)}
          className={job.enabled ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400' : ''}
        >
          {job.enabled ? 'Disable' : 'Enable'}
        </Button>
        <Link to={`/jobs/${job.id}/executions`}>
          <Button variant="ghost" size="sm">
            History
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(job.id, job.name)}
        >
          Delete
        </Button>
      </td>
    </tr>
  );
});

JobRow.displayName = 'JobRow';

export default function JobsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const { confirm, confirmState, handleConfirm, handleClose } = useConfirm();

  // Fetch jobs
  const { data: jobsData, isLoading, error } = useQuery({
    queryKey: ['jobs', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === 'enabled') params.append('enabled', 'true');
      if (filter === 'disabled') params.append('enabled', 'false');

      const response = await axios.get(`${API_URL}/jobs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    },
    staleTime: 0, // Always refetch on mount to ensure fresh data
    refetchOnMount: 'always', // Force refetch when component mounts
  });

  // Execute job mutation
  const executeJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await axios.post(`${API_URL}/jobs/${jobId}/execute`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      showSuccess('Job queued for execution');
    },
    onError: (error: any) => {
      showError(`Failed to execute job: ${getErrorMessage(error)}`);
    },
  });

  // Toggle job enabled/disabled
  const toggleJobMutation = useMutation({
    mutationFn: async ({ jobId, enabled }: { jobId: string; enabled: boolean }) => {
      const endpoint = enabled ? 'disable' : 'enable';
      const response = await axios.put(`${API_URL}/jobs/${jobId}/${endpoint}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      showSuccess(`Job ${variables.enabled ? 'disabled' : 'enabled'} successfully`);
    },
    onError: (error: any) => {
      showError(`Failed to toggle job: ${getErrorMessage(error)}`);
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await axios.delete(`${API_URL}/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      showSuccess('Job deleted successfully');
    },
    onError: (error: any) => {
      showError(`Failed to delete job: ${getErrorMessage(error)}`);
    },
  });

  const jobs: Job[] = jobsData?.data || [];

  const handleExecute = useCallback((jobId: string, jobName: string) => {
    confirm(
      () => executeJobMutation.mutateAsync(jobId),
      {
        title: 'Execute Job',
        message: `Are you sure you want to execute "${jobName}" now?`,
        confirmText: 'Execute',
        variant: 'info',
      }
    );
  }, [confirm, executeJobMutation]);

  const handleToggle = useCallback((job: Job) => {
    toggleJobMutation.mutate({ jobId: job.id, enabled: job.enabled });
  }, [toggleJobMutation]);

  const handleDelete = useCallback((jobId: string, jobName: string) => {
    confirm(
      () => deleteJobMutation.mutateAsync(jobId),
      {
        title: 'Delete Job',
        message: `Are you sure you want to delete "${jobName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger',
      }
    );
  }, [confirm, deleteJobMutation]);

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Jobs"
          description="Manage automation jobs and schedules"
          actions={
            <Button onClick={() => navigate('/jobs/new')}>
              Create Job
            </Button>
          }
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="flex space-x-2">
            {(['all', 'enabled', 'disabled'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card>
            <LoadingState variant="skeleton" lines={5} />
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load jobs: {getErrorMessage(error)}
            </p>
          </div>
        )}

        {/* Jobs List */}
        {!isLoading && !error && jobs.length === 0 && (
          <Card>
            <EmptyState
              icon={<BriefcaseIcon className="h-12 w-12" />}
              title="No jobs found"
              description="Get started by creating your first automation job"
              action={{ label: 'Create your first job', onClick: () => navigate('/jobs/new') }}
            />
          </Card>
        )}

        {!isLoading && !error && jobs.length > 0 && (
          <Card noPadding className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onExecute={handleExecute}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Confirmation Modal */}
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
