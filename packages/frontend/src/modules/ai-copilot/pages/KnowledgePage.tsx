/**
 * Knowledge Base Management Page
 * Admin view for managing Forge AI-accessible documents
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { forgeApi, type KnowledgeDocument, type KnowledgeSearchResult } from '../api';
import { documentsApi } from '../../documentation-manager/api/docs.api';

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all documents
  const { data: docsResponse, isLoading: docsLoading } = useQuery({
    queryKey: ['forge-knowledge-docs'],
    queryFn: () => forgeApi.getKnowledgeDocuments(),
  });

  // Fetch stats
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['forge-knowledge-stats'],
    queryFn: () => forgeApi.getKnowledgeStats(),
  });

  // Toggle AI access mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      documentsApi.setAiAccess(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forge-knowledge-docs'] });
      queryClient.invalidateQueries({ queryKey: ['forge-knowledge-stats'] });
    },
  });

  const documents = docsResponse?.documents || [];
  const stats = statsResponse?.stats;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await forgeApi.searchKnowledge(searchQuery);
      setSearchResults(response.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleAiAccess = (doc: KnowledgeDocument) => {
    toggleMutation.mutate({ id: doc.id, enabled: !doc.aiAccessible });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <SparklesIcon className="h-7 w-7 text-purple-600" />
            Forge Knowledge Context
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage documents that Forge can access for context-aware responses
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI-Accessible</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statsLoading ? '-' : stats?.totalAiAccessible || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Indexed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statsLoading ? '-' : stats?.totalEmbedded || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Indexing</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statsLoading ? '-' : stats?.pendingEmbedding || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Test Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Test RAG Search
        </h2>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Test a query to see which documents Forge would use..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isSearching ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="h-4 w-4" />
            )}
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found {searchResults.length} relevant documents:
            </p>
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {result.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.categoryName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {Math.round(result.similarity * 100)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Published Documents
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Toggle AI access for documents to include them in Forge's knowledge base
          </p>
        </div>

        {docsLoading ? (
          <div className="p-8 text-center text-gray-500">
            <ArrowPathIcon className="h-8 w-8 mx-auto mb-2 animate-spin" />
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No published documents found</p>
            <p className="text-sm">Create and publish documents in the Documentation module</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {doc.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {doc.categoryName} • Updated {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  {doc.aiAccessible && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${doc.hasEmbedding
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                    >
                      {doc.hasEmbedding ? 'Indexed' : 'Indexing...'}
                    </span>
                  )}

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleAiAccess(doc)}
                    disabled={toggleMutation.isPending}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${doc.aiAccessible ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'
                      } ${toggleMutation.isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${doc.aiAccessible ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
