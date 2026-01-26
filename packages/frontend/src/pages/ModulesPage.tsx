/**
 * Modules management page
 * Lists and manages installed modules
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi } from '../api/modules';
import { Module, ModuleStatus } from '../types/module.types';
import { getErrorMessage } from '../utils/error.utils';
import { showError, showSuccess, showInfo } from '../utils/toast.utils';

import { useConfirm } from '../hooks/useConfirm';
import { Button, Badge, Card, Modal, ModalFooter, PageHeader, EmptyState, LoadingState } from '../components/ui';
import ConfirmModal from '../components/ConfirmModal';
import ErrorBoundary from '../components/ErrorBoundary';

function ModulesPageContent() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const { confirm, confirmState, handleConfirm, handleClose } = useConfirm();

  const handleInstallModule = () => {
    showInfo('Module installation UI coming soon! For now, modules can be registered via API.');
  };

  // Fetch modules
  const { data: modulesData, isLoading, error } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      console.log('[ModulesPage] Fetching modules from API...');
      const modules = await modulesApi.list();
      console.log('[ModulesPage] Fetched modules:', modules);
      return modules;
    },
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Always refetch to avoid cache issues
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const modules: Module[] = Array.isArray(modulesData) ? modulesData : [];

  // Memoize module counts to avoid recalculating on every render
  const moduleCounts = useMemo(() => ({
    total: modules.length,
    enabled: modules.filter(m => m.status === ModuleStatus.ENABLED).length,
    disabled: modules.filter(m => m.status === ModuleStatus.DISABLED).length,
    registered: modules.filter(m => m.status === ModuleStatus.REGISTERED).length,
  }), [modules]);

  // Enable module mutation - simplified without optimistic updates
  const enableMutation = useMutation({
    mutationFn: (name: string) => modulesApi.enable(name),
    onSuccess: async (_data, name) => {
      // Refetch modules after successful enable
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['modules'] }),
        queryClient.invalidateQueries({ queryKey: ['navigation-structure'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] })
      ]);
      showSuccess(`Module "${name}" enabled successfully`);
      window.dispatchEvent(new CustomEvent('modules-changed'));
    },
    onError: (error: any, name) => {
      console.error('Failed to enable module:', error);
      showError(`Failed to enable module "${name}": ${getErrorMessage(error)}`);
    },
  });

  // Disable module mutation - simplified without optimistic updates
  const disableMutation = useMutation({
    mutationFn: (name: string) => modulesApi.disable(name),
    onSuccess: async (_data, name) => {
      // Refetch modules after successful disable
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['modules'] }),
        queryClient.invalidateQueries({ queryKey: ['navigation-structure'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] })
      ]);
      showSuccess(`Module "${name}" disabled successfully`);
      window.dispatchEvent(new CustomEvent('modules-changed'));
    },
    onError: (error: any, name) => {
      console.error('Failed to disable module:', error);
      showError(`Failed to disable module "${name}": ${getErrorMessage(error)}`);
    },
  });

  // Map status to badge variant
  const getStatusVariant = useCallback((status: ModuleStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' => {
    switch (status) {
      case ModuleStatus.ENABLED: return 'success';
      case ModuleStatus.DISABLED: return 'neutral';
      case ModuleStatus.INSTALLED: return 'purple';
      case ModuleStatus.REGISTERED: return 'info';
      case ModuleStatus.INSTALLING:
      case ModuleStatus.ENABLING:
      case ModuleStatus.DISABLING:
      case ModuleStatus.UPDATING: return 'warning';
      case ModuleStatus.REMOVING:
      case ModuleStatus.ERROR: return 'error';
      default: return 'neutral';
    }
  }, []);

  const getStatusBadge = useCallback((status: ModuleStatus) => {
    return (
      <Badge variant={getStatusVariant(status)} size="sm">
        {status}
      </Badge>
    );
  }, [getStatusVariant]);

  const handleToggleModule = (module: Module) => {
    if (module.status === ModuleStatus.ENABLED) {
      // Disabling - use warning variant
      confirm(
        async () => {
          await disableMutation.mutateAsync(module.name);
        },
        {
          title: 'Disable Module',
          message: `Are you sure you want to disable "${module.displayName}"? This will remove its routes and features from the sidebar.`,
          confirmText: 'Disable',
          variant: 'warning',
        }
      );
    } else if (module.status === ModuleStatus.DISABLED || module.status === ModuleStatus.INSTALLED || module.status === ModuleStatus.REGISTERED) {
      // Enabling - use info variant (less risky)
      // REGISTERED modules will be auto-installed by the backend
      confirm(
        async () => {
          await enableMutation.mutateAsync(module.name);
        },
        {
          title: 'Enable Module',
          message: `Enable "${module.displayName}"? Its routes and features will be added to the sidebar.`,
          confirmText: 'Enable',
          variant: 'info',
        }
      );
    } else {
      showError(`Cannot toggle module with status: ${module.status}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <Card>
            <LoadingState variant="skeleton" lines={3} />
          </Card>
          <Card>
            <LoadingState variant="skeleton" lines={5} />
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error loading modules</h3>
            <p className="text-red-600 dark:text-red-400 text-sm">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">

      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Modules"
          description="Manage installed automation modules"
          actions={
            <Button onClick={handleInstallModule}>
              Install Module
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Modules</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{moduleCounts.total}</div>
          </Card>
          <Card>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Enabled</div>
            <div className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
              {moduleCounts.enabled}
            </div>
          </Card>
          <Card>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Disabled</div>
            <div className="mt-1 text-2xl font-semibold text-gray-600 dark:text-gray-400">
              {moduleCounts.disabled}
            </div>
          </Card>
          <Card>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Registered</div>
            <div className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {moduleCounts.registered}
            </div>
          </Card>
        </div>

        {/* Modules list */}
        {modules.length === 0 ? (
          <EmptyState
            title="No modules"
            description="Get started by installing your first module."
            action={{ label: "Install Module", onClick: handleInstallModule }}
          />
        ) : (
          <Card noPadding className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Installed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {modules.map((module) => (
                  <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {module.displayName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {module.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{module.version}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(module.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {module.installedAt
                        ? new Date(module.installedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {(module.status === ModuleStatus.ENABLED || module.status === ModuleStatus.DISABLED || module.status === ModuleStatus.INSTALLED || module.status === ModuleStatus.REGISTERED) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={module.status === ModuleStatus.ENABLED
                            ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }
                          onClick={() => handleToggleModule(module)}
                          disabled={enableMutation.isPending || disableMutation.isPending}
                          isLoading={(enableMutation.isPending || disableMutation.isPending) && (enableMutation.variables === module.name || disableMutation.variables === module.name)}
                        >
                          {module.status === ModuleStatus.ENABLED ? 'Disable' : 'Enable'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => setSelectedModule(module)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Module details modal */}
        <Modal
          isOpen={!!selectedModule}
          onClose={() => setSelectedModule(null)}
          title={selectedModule?.displayName || 'Module Details'}
        >
          {selectedModule && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  v{selectedModule.version}
                </span>
                {getStatusBadge(selectedModule.status)}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedModule.description}</p>
              </div>

              {selectedModule.manifest?.routes && selectedModule.manifest.routes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Routes</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {selectedModule.manifest.routes.map((route, idx) => (
                        <li key={idx} className="font-mono flex gap-2">
                          <span className="font-bold text-gray-700 dark:text-gray-300">{route.method}</span>
                          <span>{route.path}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          <ModalFooter>
            <Button onClick={() => setSelectedModule(null)}>Close</Button>
          </ModalFooter>
        </Modal>
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

// Wrap with ErrorBoundary to prevent module rendering errors from crashing the app
export default function ModulesPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Failed to load modules page
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              There was an error loading the modules. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <ModulesPageContent />
    </ErrorBoundary>
  );
}
