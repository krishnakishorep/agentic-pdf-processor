'use client';

import { useState, useEffect } from 'react';
import { documentEvents } from '@/lib/document-events';

interface Document {
  id: string;
  filename: string;
  status: string;
  document_type: string;
  display_status: string;
  time_ago: string;
}

interface RecentActivityProps {
  refreshTrigger?: number; // Change this to trigger a refresh
}

export default function RecentActivity({ refreshTrigger }: RecentActivityProps) {
  console.log('🔄 RecentActivity component rendered/re-rendered, refreshTrigger:', refreshTrigger);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/documents');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch documents');
      }

      setDocuments(result.documents);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data once on mount - RE-ENABLED
  useEffect(() => {
    console.log('🔍 RecentActivity mounted, loading initial data');
    fetchDocuments(); // RE-ENABLED
  }, []); // Only run once on mount

  // TEMPORARILY DISABLED - causing infinite loop on app start
  useEffect(() => {
    console.log('🔍 RecentActivity useEffect would trigger, refreshTrigger:', refreshTrigger);
    // fetchDocuments(); // DISABLED
  }, [refreshTrigger]);

  // Auto-refresh on document events - SIMPLIFIED to avoid loops
  useEffect(() => {
    const cleanup = documentEvents.onAllDocumentEvents((event) => {
      console.log('📨 RecentActivity received document event:', event.status);
      
      // Only refresh on final completion - no debouncing needed since UploadButton handles the main refresh
      if (event.status === 'completed') {
        console.log('📄 Document completed, will refresh via main flow');
        // Let the main page handle refresh via refreshTrigger - no need to double-refresh
      }
    });

    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'uploaded':
        return '📄';
      case 'processing':
        return '⏳';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg max-w-3xl mx-auto">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={fetchDocuments}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg max-w-3xl mx-auto">
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">📄</span>
          <h4 className="text-gray-500 font-semibold mb-2">No documents yet</h4>
          <p className="text-gray-400">Upload your first PDF to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-3xl mx-auto">
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <div 
            key={doc.id} 
            className={`flex items-center gap-4 ${index < documents.length - 1 ? 'mb-6 pb-4 border-b border-gray-100' : ''}`}
          >
            <span className="text-2xl">
              {getStatusEmoji(doc.status)}
            </span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{doc.filename}</h4>
              <p className="text-gray-600 text-sm">
                {doc.display_status}
                {doc.document_type !== 'Unknown' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {doc.document_type}
                  </span>
                )}
              </p>
            </div>
            <span className="text-gray-500 text-sm">{doc.time_ago}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={fetchDocuments}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
