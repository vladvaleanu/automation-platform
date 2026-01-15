/**
 * Endpoints Management Page
 * CRUD interface for power meter endpoints
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Power, TestTube } from 'lucide-react';
import { endpointsApi, Endpoint } from '../api/endpoints';
import EndpointFormModal from '../components/EndpointFormModal';
import { getErrorMessage } from '../utils/error.utils';
import { showError, showSuccess, showInfo } from '../utils/toast.utils';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonLoader } from '../components/LoadingSpinner';

export default function EndpointsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const { confirm, confirmState, handleConfirm, handleClose } = useConfirm();

  // Fetch endpoints
  const { data: endpointsRaw, isLoading } = useQuery({
    queryKey: ['endpoints'],
    queryFn: () => endpointsApi.list(),
  });

  const endpoints = Array.isArray(endpointsRaw) ? endpointsRaw : [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => endpointsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      showSuccess('Endpoint deleted successfully');
    },
    onError: (error: any) => {
      showError(`Failed to delete endpoint: ${getErrorMessage(error)}`);
    },
  });

  // Test mutation
  const testMutation = useMutation({
    mutationFn: (id: string) => endpointsApi.test(id),
    onSuccess: (data) => {
      if (data.success) {
        showSuccess(`Test successful! Value: ${data.value} ${data.unit || 'kWh'}`);
      } else {
        showError(`Test failed: ${data.error}`);
      }
    },
    onError: (error: any) => {
      showError(`Failed to test endpoint: ${getErrorMessage(error)}`);
    },
  });

  const handleEdit = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    confirm(
      () => deleteMutation.mutateAsync(id),
      {
        title: 'Delete Endpoint',
        message: `Are you sure you want to delete endpoint "${name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger',
      }
    );
  };

  const handleTest = async (id: string) => {
    showInfo('Testing endpoint...');
    await testMutation.mutateAsync(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEndpoint(null);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <SkeletonLoader lines={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Power Meter Endpoints
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure and manage power consumption monitoring endpoints
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Endpoint
        </button>
      </div>

      {/* Endpoints Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {endpoints.length === 0 ? (
          <div className="p-12 text-center">
            <Power size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No endpoints configured
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by adding your first power meter endpoint
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Your First Endpoint
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name / Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type / Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Poll Interval
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {endpoint.name}
                    </div>
                    {endpoint.clientName && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {endpoint.clientName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {endpoint.ipAddress}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {endpoint.type}
                    </div>
                    {endpoint.vendor && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {endpoint.vendor}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {endpoint.location || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {endpoint.enabled ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {endpoint.pollInterval} min
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTest(endpoint.id)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        title="Test scraping"
                      >
                        <TestTube size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(endpoint)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(endpoint.id, endpoint.name)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats */}
      {endpoints.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Endpoints</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {endpoints.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Enabled</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {endpoints.filter(e => e.enabled).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Disabled</div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {endpoints.filter(e => !e.enabled).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Auth Required</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {endpoints.filter(e => e.authType !== 'none').length}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <EndpointFormModal
          endpoint={editingEndpoint}
          onClose={handleCloseModal}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['endpoints'] });
            handleCloseModal();
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
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        isLoading={confirmState.isLoading}
      />
    </div>
  );
}
