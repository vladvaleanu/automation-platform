/**
 * Executions Page - View job execution history
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import ErrorBoundary from '../components/ErrorBoundary';
import { Button, Card, PageHeader, Badge, LoadingState, EmptyState } from '../components/ui';
import { ClockIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '../utils/error.utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';

interface Execution {
  id: string;
  jobId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  result?: Record<string, any>;
  error?: string;
  job?: {
    id: string;
    name: string;
    moduleId: string;
  };
}

function ExecutionsPageContent() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  // Fetch executions
  const { data: executionsData, isLoading, error } = useQuery({
    queryKey: ['executions', jobId, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (jobId) params.append('jobId', jobId);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await axios.get(`${API_URL}/executions?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchIntervalInBackground: false, // Don't refetch when tab is hidden (saves bandwidth & battery)
  });

  const executions: Execution[] = executionsData?.data || [];
  const pagination = executionsData?.pagination;

  const getStatusVariant = (status: ExecutionStatus) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'RUNNING': return 'info';
      case 'FAILED': return 'error';
      case 'TIMEOUT': return 'warning';
      case 'CANCELLED': return 'neutral';
      case 'PENDING': return 'warning';
      default: return 'neutral';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  return (
    <div className="p-8">

      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Execution History"
          description={jobId ? 'Job-specific execution history' : 'All job executions'}
          actions={
            jobId ? (
              <Button onClick={() => navigate('/jobs')} variant="secondary">
                Back to Jobs
              </Button>
            ) : undefined
          }
        />

        {/* Status Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(status as any);
                  setPage(1);
                }}
              >
                {status}
              </Button>
            ))}
          </div>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card>
            <LoadingState text="Loading executions..." />
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load executions: {getErrorMessage(error)}
            </p>
          </div>
        )}

        {/* Executions List */}
        {!isLoading && !error && executions.length === 0 && (
          <Card>
            <EmptyState
              icon={<ClockIcon className="h-12 w-12" />}
              title="No executions found"
              description="Job execution history will appear here once jobs are run."
            />
          </Card>
        )}

        {!isLoading && !error && executions.length > 0 && (
          <>
            <Card noPadding className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {executions.map((execution) => (
                    <tr key={execution.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {execution.job?.name || execution.jobId}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {execution.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusVariant(execution.status)}>
                          {execution.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(execution.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/executions/${execution.id}`}>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

// Wrap with ErrorBoundary to prevent execution rendering errors from crashing the app
export default function ExecutionsPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Failed to load executions
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              There was an error loading the execution history. Please try refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="danger"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <ExecutionsPageContent />
    </ErrorBoundary>
  );
}
