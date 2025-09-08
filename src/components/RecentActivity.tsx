'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentEvents } from '@/lib/document-events';

interface Document {
  id: string;
  filename: string;
  status: string;
  document_type: string;
  display_status: string;
  time_ago: string;
  emoji?: string;
  action?: string;
  preview?: string;
  sources_count?: number;
}

interface RecentActivityProps {
  refreshTrigger?: number; // Change this to trigger a refresh
}

export default function RecentActivity({ refreshTrigger }: RecentActivityProps) {
  console.log('🔄 RecentActivity component rendered/re-rendered, refreshTrigger:', refreshTrigger);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleItemClick = (doc: Document) => {
    // If it's AI content, navigate to write page with content ID
    if (doc.action) {
      router.push(`/write?content=${doc.id}`);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch AI written content first
      const response = await fetch('/api/ai-written-content');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch recent content');
      }

      // If no AI content, fall back to regular documents
      if (result.documents.length === 0) {
        const docResponse = await fetch('/api/documents');
        const docResult = await docResponse.json();
        
        if (docResponse.ok) {
          setDocuments(docResult.documents);
        } else {
          setDocuments([]);
        }
      } else {
        setDocuments(result.documents);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recent content');
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

  const getStatusEmoji = (doc: Document) => {
    // Use AI action emoji if available
    if (doc.emoji) {
      return doc.emoji;
    }
    
    // Fallback to status emojis for regular documents
    switch (doc.status) {
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
          <span className="text-6xl mb-4 block">✨</span>
          <h4 className="text-gray-500 font-semibold mb-2">No AI content yet</h4>
          <p className="text-gray-400">Create your first AI-assisted content to see it here!</p>
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
            className={`flex items-center gap-4 ${index < documents.length - 1 ? 'mb-6 pb-4 border-b border-gray-100' : ''} ${
              doc.action ? 'cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors' : ''
            }`}
            onClick={() => handleItemClick(doc)}
          >
            <span className="text-2xl">
              {getStatusEmoji(doc)}
            </span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{doc.filename}</h4>
              <p className="text-gray-600 text-sm">
                {doc.display_status}
                {doc.sources_count && doc.sources_count > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {doc.sources_count} source{doc.sources_count > 1 ? 's' : ''}
                  </span>
                )}
                {doc.document_type !== 'Unknown' && !doc.action && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {doc.document_type}
                  </span>
                )}
              </p>
              {doc.preview && (
                <p className="text-gray-500 text-xs mt-1 italic">{doc.preview}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-sm">{doc.time_ago}</span>
              {doc.action && (
                <p className="text-blue-500 text-xs mt-1">Click to resume</p>
              )}
            </div>
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
