/**
 * Events Page - View event history and statistics
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { PageHeader, Card, Input, FormField, EmptyState, LoadingState, Button } from '../components/ui';
import { getErrorMessage } from '../utils/error.utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

interface Event {
  id: string;
  name: string;
  source: string;
  payload: Record<string, any>;
  createdAt: string;
}

interface EventStats {
  total: number;
  last24h: number;
  last7d: number;
  topEvents: Array<{ name: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
}

export default function EventsPage() {
  const [nameFilter, setNameFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);

  // Fetch events
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['events', nameFilter, sourceFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (nameFilter) params.append('name', nameFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await axios.get(`${API_URL}/events?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch event statistics
  const { data: statsData } = useQuery({
    queryKey: ['events', 'stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/events/stats/summary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const events: Event[] = eventsData?.data || [];
  const pagination = eventsData?.pagination;
  const stats: EventStats | undefined = statsData?.data;

  return (
    <div className="p-8">

      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Events"
          description="Cross-module communication and event history"
        />

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total.toLocaleString()}
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last 24 Hours</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.last24h.toLocaleString()}
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last 7 Days</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.last7d.toLocaleString()}
              </p>
            </Card>
          </div>
        )}

        {/* Top Events & Sources */}
        {stats && (stats.topEvents.length > 0 || stats.topSources.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Top Events */}
            {stats.topEvents.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Events
                </h3>
                <div className="space-y-2">
                  {stats.topEvents.slice(0, 5).map((event) => (
                    <div key={event.name} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                        {event.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {event.count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Top Sources */}
            {stats.topSources.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Sources
                </h3>
                <div className="space-y-2">
                  {stats.topSources.slice(0, 5).map((source) => (
                    <div key={source.source} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {source.source}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {source.count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Event Name">
              <Input
                type="text"
                value={nameFilter}
                onChange={(e) => {
                  setNameFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by event name..."
              />
            </FormField>
            <FormField label="Source">
              <Input
                type="text"
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by source..."
              />
            </FormField>
          </div>
        </Card>

        {/* Loading */}
        {isLoading && <LoadingState text="Loading events..." />}

        {/* Error */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load events: {getErrorMessage(error)}
            </p>
          </Card>
        )}

        {/* Events List */}
        {!isLoading && !error && events.length === 0 && (
          <EmptyState
            title="No events found"
          />
        )}

        {!isLoading && !error && events.length > 0 && (
          <>
            <Card noPadding className="overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {events.map((event) => (
                  <div key={event.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                          {event.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Source: <span className="font-medium">{event.source}</span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {Object.keys(event.payload).length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                          View Payload
                        </summary>
                        <pre className="mt-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-md overflow-x-auto text-xs font-mono text-gray-900 dark:text-white">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
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
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    variant="secondary"
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
