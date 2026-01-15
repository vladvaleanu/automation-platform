/**
 * History Page
 * Historical consumption data and charts
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, Filter, Calendar } from 'lucide-react';
import { consumptionApi } from '../api/consumption';
import { endpointsApi } from '../api/endpoints';

export default function HistoryPage() {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Fetch endpoints for filter
  const { data: endpointsRaw } = useQuery({
    queryKey: ['endpoints'],
    queryFn: () => endpointsApi.list(),
  });

  const endpoints = Array.isArray(endpointsRaw) ? endpointsRaw : [];

  // Fetch readings with filters
  const { data: readingsRaw, isLoading } = useQuery({
    queryKey: ['consumption', 'readings', selectedEndpointId, startDate, endDate],
    queryFn: () =>
      consumptionApi.getReadings({
        endpointId: selectedEndpointId || undefined,
        startDate,
        endDate,
        limit: 1000,
      }),
  });

  const readings = Array.isArray(readingsRaw) ? readingsRaw : [];

  const handleReset = () => {
    setSelectedEndpointId('');
    setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Consumption History
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View and analyze historical power consumption data
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Endpoint
            </label>
            <select
              value={selectedEndpointId}
              onChange={(e) => setSelectedEndpointId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Endpoints</option>
              {endpoints.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {readings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Readings
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {readings.length}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              First Reading
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {readings[0]?.totalKwh !== undefined && readings[0]?.totalKwh !== null
                ? `${readings[0].totalKwh.toFixed(2)} kWh`
                : '-'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {readings[0]?.timestamp ? new Date(readings[0].timestamp).toLocaleDateString() : '-'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Latest Reading
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {readings[readings.length - 1]?.totalKwh !== undefined && readings[readings.length - 1]?.totalKwh !== null
                ? `${readings[readings.length - 1].totalKwh.toFixed(2)} kWh`
                : '-'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {readings[readings.length - 1]?.timestamp
                ? new Date(readings[readings.length - 1].timestamp).toLocaleDateString()
                : '-'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Consumption
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {readings[readings.length - 1]?.totalKwh !== undefined &&
              readings[readings.length - 1]?.totalKwh !== null &&
              readings[0]?.totalKwh !== undefined &&
              readings[0]?.totalKwh !== null
                ? `${(readings[readings.length - 1].totalKwh - readings[0].totalKwh).toFixed(2)} kWh`
                : '-'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Period total
            </div>
          </div>
        </div>
      )}

      {/* Readings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="text-gray-600 dark:text-gray-400">Loading readings...</div>
          </div>
        ) : readings.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingDown size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No readings found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or date range
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total kWh
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Voltage (V)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current (A)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Power (W)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {readings.map((reading, index) => {
                  const delta = index > 0 ? reading.totalKwh - readings[index - 1].totalKwh : 0;
                  return (
                    <tr key={reading.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDateTime(reading.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {reading.totalKwh !== undefined && reading.totalKwh !== null
                            ? reading.totalKwh.toFixed(2)
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {reading.voltage !== undefined && reading.voltage !== null
                            ? reading.voltage.toFixed(1)
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {reading.current !== undefined && reading.current !== null
                            ? reading.current.toFixed(2)
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {reading.power !== undefined && reading.power !== null
                            ? reading.power.toFixed(0)
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {index > 0 ? `+${delta.toFixed(2)}` : '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {readings.length > 100 && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Showing first 1000 readings. Use filters to narrow down the results.
        </div>
      )}
    </div>
  );
}
