/**
 * Execution Detail Page - View detailed execution information and logs
 */

import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { format } from 'date-fns';

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
  logs?: string;
  job?: {
    id: string;
    name: string;
    description?: string;
    moduleId: string;
    handler: string;
  };
}

export default function ExecutionDetailPage() {
  const { id } = useParams();

  // Fetch execution details
  const { data: executionData, isLoading, error } = useQuery({
    queryKey: ['execution', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/executions/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    refetchInterval: (data) => {
      // Auto-refresh if still running
      const status = data?.data?.status;
      return status === 'RUNNING' || status === 'PENDING' ? 2000 : false;
    },
  });

  const execution: Execution | undefined = executionData?.data;

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'TIMEOUT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Execution Details
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ID: {id}
            </p>
          </div>
          <Link
            to="/executions"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium"
          >
            Back to Executions
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading execution...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load execution: {(error as any).message}
            </p>
          </div>
        )}

        {/* Execution Details */}
        {!isLoading && !error && execution && (
          <>
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Execution Status
                </h2>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                    execution.status
                  )}`}
                >
                  {execution.status}
                </span>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {execution.job?.name || 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Handler</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    {execution.job?.handler || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Started At</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(execution.startedAt), 'PPpp')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed At</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {execution.completedAt ? format(new Date(execution.completedAt), 'PPpp') : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDuration(execution.duration)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Job ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    <Link
                      to={`/jobs/${execution.jobId}/executions`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {execution.jobId}
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Error Message */}
            {execution.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  Error
                </h2>
                <pre className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap font-mono">
                  {execution.error}
                </pre>
              </div>
            )}

            {/* Result */}
            {execution.result && Object.keys(execution.result).length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Result
                </h2>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm font-mono text-gray-900 dark:text-white">
                  {JSON.stringify(execution.result, null, 2)}
                </pre>
              </div>
            )}

            {/* Logs */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Execution Logs
              </h2>
              {execution.logs ? (
                <div className="bg-gray-900 p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">
                    {execution.logs}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No logs available</p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
