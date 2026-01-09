/**
 * Events Page - View event history and statistics
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cross-module communication and event history
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last 24 Hours</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.last24h.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last 7 Days</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.last7d.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Top Events & Sources */}
        {stats && (stats.topEvents.length > 0 || stats.topSources.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Top Events */}
            {stats.topEvents.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
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
              </div>
            )}

            {/* Top Sources */}
            {stats.topSources.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
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
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => {
                  setNameFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by event name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Source
              </label>
              <input
                type="text"
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by source..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading events...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load events: {(error as any).message}
            </p>
          </div>
        )}

        {/* Events List */}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No events found</p>
          </div>
        )}

        {!isLoading && !error && events.length > 0 && (
          <>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
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
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
