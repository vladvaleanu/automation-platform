/**
 * Documentation Manager Page
 * Main page for browsing and managing documents
 */

import { useState } from 'react';
import { PlusIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import DocumentBrowser from '../components/DocumentBrowser';
import { DocumentViewer } from '../components/DocumentViewer';
import { DocumentEditor } from '../components/DocumentEditor';
import { MediaGallery } from '../components/MediaGallery';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { PageHeader, Button, EmptyState } from '../../../components/ui';
import type { Document, DocumentListItem } from '../api/docs.api';

type ViewMode = 'documents' | 'media';

export function DocumentationPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('documents');
  const [selectedDocument, setSelectedDocument] = useState<DocumentListItem | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSelectDocument = (document: DocumentListItem) => {
    setSelectedDocument(document);
  };

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setShowEditor(true);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingDocument(null);
  };

  const handleSaveDocument = (document: Document) => {
    setSelectedDocument(document);
    setEditingDocument(document); // Update editor to edit mode with new document
    // Don't close editor - it stays open after save
    // User closes with X button only
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Document Browser (only show in documents view) */}
      {viewMode === 'documents' && (
        <div className="w-80 flex-shrink-0">
          <ErrorBoundary moduleName="Document Browser">
            <DocumentBrowser
              onSelectDocument={handleSelectDocument}
              selectedDocumentId={selectedDocument?.id}
              onDocumentDeleted={(deletedId) => {
                if (selectedDocument?.id === deletedId) {
                  setSelectedDocument(null);
                  setEditingDocument(null);
                  setShowEditor(false);
                }
              }}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <PageHeader
          title="Knowledge Base"
          description="Manage your documentation and media assets"
          actions={
            viewMode === 'documents' && (
              <Button
                onClick={handleCreateDocument}
                variant="primary"
                leftIcon={<PlusIcon className="h-4 w-4" />}
                className="flex items-center gap-2"
              >
                New Document
              </Button>
            )
          }
        >
          {/* View Mode Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mt-4 w-fit">
            <button
              onClick={() => setViewMode('documents')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'documents'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              <DocumentTextIcon className="h-4 w-4" />
              Documents
            </button>
            <button
              onClick={() => setViewMode('media')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'media'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              <PhotoIcon className="h-4 w-4" />
              Media
            </button>
          </div>
        </PageHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'documents' ? (
            selectedDocument ? (
              <ErrorBoundary moduleName="Document Viewer">
                <DocumentViewer
                  documentId={selectedDocument.id}
                  onEdit={handleEditDocument}
                />
              </ErrorBoundary>
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  title="No document selected"
                  description="Select a document from the sidebar or create a new one"
                  icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
                />
              </div>
            )
          ) : (
            <MediaGallery />
          )}
        </div>
      </div>

      {/* Document Editor Modal */}
      {showEditor && (
        <ErrorBoundary moduleName="Document Editor">
          <DocumentEditor
            documentId={editingDocument?.id}
            onClose={handleCloseEditor}
            onSave={handleSaveDocument}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default DocumentationPage;
