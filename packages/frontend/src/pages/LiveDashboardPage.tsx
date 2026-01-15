/**
 * Live Dashboard Page
 * Real-time power consumption monitoring
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, Zap, Power, AlertCircle } from 'lucide-react';
import { consumptionApi } from '../api/consumption';

export default function LiveDashboardPage() {
  // Fetch live dashboard data with auto-refresh every 30 seconds
  const { data, isLoading } = useQuery({
    queryKey: ['consumption', 'live'],
    queryFn: () => consumptionApi.getLiveDashboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'offline':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Activity size={16} className="text-green-600 dark:text-green-400" />;
      case 'offline':
        return <Power size={16} className="text-gray-600 dark:text-gray-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600 dark:text-gray-400">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Live Power Monitoring
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Real-time power consumption across all endpoints
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Endpoints
            </div>
            <Power className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.summary.totalEndpoints}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Now
            </div>
            <Activity className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {data.summary.activeEndpoints}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Consumption
            </div>
            <Zap className="text-yellow-600 dark:text-yellow-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.summary.totalKwh.toFixed(1)}
            <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">kWh</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              This Month
            </div>
            <Zap className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.summary.monthlyConsumption.toFixed(1)}
            <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">kWh</span>
          </div>
        </div>
      </div>

      {/* Endpoints Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Endpoint Status
          </h2>
        </div>

        {data.endpoints.length === 0 ? (
          <div className="p-12 text-center">
            <Power size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              No endpoints configured yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Endpoint Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {endpoint.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                        {getStatusIcon(endpoint.status)}
                        {endpoint.status}
                      </span>
                      {!endpoint.enabled && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      {endpoint.clientName && (
                        <div>
                          <span className="font-medium">Client:</span> {endpoint.clientName}
                        </div>
                      )}
                      {endpoint.location && (
                        <div>
                          <span className="font-medium">Location:</span> {endpoint.location}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Last reading:</span>{' '}
                        {formatTimestamp(endpoint.lastReading?.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  {endpoint.lastReading && (
                    <div className="ml-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-right">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Total kWh
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {endpoint.lastReading.totalKwh.toFixed(2)}
                        </div>
                      </div>

                      {endpoint.lastReading.voltage !== undefined && endpoint.lastReading.voltage !== null && (
                        <div className="text-right">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Voltage
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {endpoint.lastReading.voltage.toFixed(1)}
                            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">V</span>
                          </div>
                        </div>
                      )}

                      {endpoint.lastReading.current !== undefined && endpoint.lastReading.current !== null && (
                        <div className="text-right">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Current
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {endpoint.lastReading.current.toFixed(2)}
                            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">A</span>
                          </div>
                        </div>
                      )}

                      {endpoint.lastReading.power !== undefined && endpoint.lastReading.power !== null && (
                        <div className="text-right">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Power
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {endpoint.lastReading.power.toFixed(0)}
                            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">W</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!endpoint.lastReading && endpoint.enabled && (
                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">
                    No readings available yet. Waiting for first poll...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Auto-refreshing every 30 seconds
      </div>
    </div>
  );
}
