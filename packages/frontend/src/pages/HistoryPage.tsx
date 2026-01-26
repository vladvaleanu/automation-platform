/**
 * History Page
 * Historical consumption data and charts
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, Filter } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { consumptionApi } from '../api/consumption';
import { endpointsApi } from '../api/endpoints';
import { PageHeader, Card, Button, Select, Input, FormField, EmptyState, LoadingState } from '../components/ui';

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

  // Prepare chart data - aggregate by hour for cleaner visualization
  const chartData = useMemo(() => {
    if (readings.length === 0) return [];

    // Sort readings by timestamp ascending for chart
    const sorted = [...readings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Sample data if too many points (keep max 100 points for performance)
    const step = Math.max(1, Math.floor(sorted.length / 100));
    const sampled = sorted.filter((_, i) => i % step === 0);

    return sampled.map((r, idx) => {
      const prevReading = idx > 0 ? sampled[idx - 1] : null;
      const delta = prevReading && r.totalKwh && prevReading.totalKwh
        ? r.totalKwh - prevReading.totalKwh
        : 0;

      return {
        timestamp: new Date(r.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        totalKwh: r.totalKwh ?? 0,
        power: r.power ?? 0,
        delta: Math.max(0, delta),
      };
    });
  }, [readings]);

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
      <PageHeader
        title="Consumption History"
        description="View and analyze historical power consumption data"
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="Endpoint">
            <Select
              value={selectedEndpointId}
              onChange={(e) => setSelectedEndpointId(e.target.value)}
            >
              <option value="">All Endpoints</option>
              {endpoints.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Start Date">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>

          <FormField label="End Date">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>

          <div className="flex items-end">
            <Button
              onClick={handleReset}
              variant="secondary"
              className="w-full"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Consumption Trend Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Consumption Trend
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {chartData.length} data points
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                  label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                  label={{ value: 'Power (W)', angle: 90, position: 'insideRight', fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#F9FAFB',
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalKwh"
                  stroke="#3B82F6"
                  fill="url(#colorKwh)"
                  strokeWidth={2}
                  name="Total kWh"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="power"
                  stroke="#10B981"
                  fill="url(#colorPower)"
                  strokeWidth={2}
                  name="Power (W)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Stats */}
      {readings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Readings
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {readings.length}
            </div>
          </Card>

          <Card>
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
          </Card>

          <Card>
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
          </Card>

          <Card>
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
          </Card>
        </div>
      )}

      {/* Readings Table */}
      <Card noPadding className="overflow-hidden">
        {isLoading ? (
          <LoadingState text="Loading readings..." />
        ) : readings.length === 0 ? (
          <EmptyState
            icon={<TrendingDown size={48} />}
            title="No readings found"
            description="Try adjusting your filters or date range"
          />
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
      </Card>

      {readings.length > 100 && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Showing first 1000 readings. Use filters to narrow down the results.
        </div>
      )}
    </div>
  );
}
