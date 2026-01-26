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
import { Button, Card, PageHeader, Badge, EmptyState, LoadingState } from '../components/ui';

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
        <Card>
          <LoadingState variant="skeleton" lines={5} />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <PageHeader
        title="Power Meter Endpoints"
        description="Configure and manage power consumption monitoring endpoints"
        actions={
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={18} />}>
            Add Endpoint
          </Button>
        }
      />

      {/* Endpoints Table */}
      <Card noPadding className="overflow-hidden">
        {endpoints.length === 0 ? (
          <EmptyState
            icon={<Power size={48} />}
            title="No endpoints configured"
            description="Get started by adding your first power meter endpoint"
            action={{ label: 'Add Your First Endpoint', onClick: () => setIsModalOpen(true) }}
          />
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
                    <Badge variant={endpoint.enabled ? 'success' : 'neutral'} size="sm">
                      {endpoint.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {endpoint.pollInterval} min
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleTest(endpoint.id)}
                        title="Test scraping"
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400"
                      >
                        <TestTube size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleEdit(endpoint)}
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDelete(endpoint.id, endpoint.name)}
                        title="Delete"
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Stats */}
      {endpoints.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Endpoints</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {endpoints.length}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">Enabled</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {endpoints.filter(e => e.enabled).length}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">Disabled</div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {endpoints.filter(e => !e.enabled).length}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">Auth Required</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {endpoints.filter(e => e.authType !== 'none').length}
            </div>
          </Card>
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
