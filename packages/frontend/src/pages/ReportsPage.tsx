/**
 * Reports Page
 * Monthly consumption reports for billing
 */

import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calendar } from 'lucide-react';
import { consumptionApi } from '../api/consumption';
import { PageHeader, Card, Button, EmptyState, LoadingState } from '../components/ui';

export default function ReportsPage() {
  // Fetch monthly summary
  const { data: monthlyDataRaw, isLoading } = useQuery({
    queryKey: ['consumption', 'monthly-summary'],
    queryFn: () => consumptionApi.getMonthlySummary(),
  });

  // Ensure monthlyData is always an array
  const monthlyData = Array.isArray(monthlyDataRaw) ? monthlyDataRaw : [];

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleExportCSV = () => {
    if (monthlyData.length === 0) return;

    // Generate CSV
    const headers = ['Client', 'Endpoint', 'Location', 'Current kWh', 'Previous kWh', 'Consumed kWh', 'Last Reading', 'Readings Count'];
    const rows = monthlyData.map(item => [
      item.clientName || '-',
      item.endpointName,
      item.location || '-',
      item.currentKwh !== undefined && item.currentKwh !== null ? item.currentKwh.toFixed(2) : '0.00',
      item.previousKwh !== undefined && item.previousKwh !== null ? item.previousKwh.toFixed(2) : '0.00',
      item.consumedKwh !== undefined && item.consumedKwh !== null ? item.consumedKwh.toFixed(2) : '0.00',
      item.lastReadingAt ? new Date(item.lastReadingAt).toLocaleString() : '-',
      item.readingsCount || 0,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consumption-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalConsumed = monthlyData.reduce((sum, item) => sum + (item.consumedKwh || 0), 0);
  const totalCurrent = monthlyData.reduce((sum, item) => sum + (item.currentKwh || 0), 0);

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingState text="Loading reports..." />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <PageHeader
        title="Consumption Reports"
        description={(
          <span className="flex items-center gap-2">
            <Calendar size={16} />
            {currentMonth}
          </span>
        ) as any}
        actions={
          <Button
            onClick={handleExportCSV}
            disabled={monthlyData.length === 0}
            leftIcon={<Download size={18} />}
          >
            Export CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Endpoints
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {monthlyData.length}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Consumed This Month
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalConsumed.toFixed(2)}
            <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">kWh</span>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Current Total
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalCurrent.toFixed(2)}
            <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">kWh</span>
          </div>
        </Card>
      </div>

      {/* Reports Table */}
      <Card noPadding className="overflow-hidden">
        {monthlyData.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No consumption data"
            description="No consumption readings available for this month"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client / Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Previous Reading
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Reading
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Consumed (Month)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Reading
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {monthlyData.map((item) => (
                  <tr key={item.endpointId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.endpointName}
                      </div>
                      {item.clientName && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.clientName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.location || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.previousKwh !== undefined && item.previousKwh !== null
                          ? `${item.previousKwh.toFixed(2)} kWh`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.currentKwh !== undefined && item.currentKwh !== null
                          ? `${item.currentKwh.toFixed(2)} kWh`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {item.consumedKwh !== undefined && item.consumedKwh !== null
                          ? `${item.consumedKwh.toFixed(2)} kWh`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.lastReadingAt
                          ? new Date(item.lastReadingAt).toLocaleString()
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.readingsCount}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                    Total:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">
                    {totalConsumed.toFixed(2)} kWh
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

      </Card>

      {/* Billing Note */}
      {monthlyData.length > 0 && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Billing Information
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Monthly consumption is calculated as the difference between the current reading
                and the first reading of the month. Export to CSV for billing records.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
