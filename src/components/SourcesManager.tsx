'use client';

import { useState, useRef } from 'react';

export interface Source {
  id: string;
  type: 'url' | 'pdf' | 'screenshot';
  name: string;
  content: string;
  status: 'processing' | 'ready' | 'error';
  error?: string;
  url?: string;
  file?: File;
}

interface SourcesManagerProps {
  sources: Source[];
  onSourcesChange: (sources: Source[]) => void;
  className?: string;
}

export default function SourcesManager({ sources, onSourcesChange, className = '' }: SourcesManagerProps) {
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const addUrlSource = async () => {
    if (!urlInput.trim()) return;
    
    setIsProcessingUrl(true);
    
    const newSource: Source = {
      id: `url-${Date.now()}`,
      type: 'url',
      name: urlInput,
      content: '',
      status: 'processing',
      url: urlInput
    };
    
    onSourcesChange([...sources, newSource]);
    
    try {
      const response = await fetch('/api/process-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', url: urlInput })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const updatedSource: Source = {
          ...newSource,
          status: 'ready',
          content: result.content,
          name: result.title || urlInput
        };
        
        onSourcesChange([
          ...sources.filter(s => s.id !== newSource.id),
          updatedSource
        ]);
      } else {
        throw new Error(result.error || `HTTP ${response.status}: Failed to process URL`);
      }
    } catch (error) {
      const errorSource: Source = {
        ...newSource,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed'
      };
      
      onSourcesChange([
        ...sources.filter(s => s.id !== newSource.id),
        errorSource
      ]);
    } finally {
      setIsProcessingUrl(false);
      setUrlInput('');
      setIsAddingSource(false);
    }
  };

  const addFileSource = async (file: File, type: 'pdf' | 'screenshot') => {
    const newSource: Source = {
      id: `${type}-${Date.now()}`,
      type,
      name: file.name,
      content: '',
      status: 'processing',
      file
    };
    
    onSourcesChange([...sources, newSource]);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/process-source', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const updatedSource: Source = {
          ...newSource,
          status: 'ready',
          content: result.content
        };
        
        onSourcesChange([
          ...sources.filter(s => s.id !== newSource.id),
          updatedSource
        ]);
      } else {
        throw new Error(result.error || `HTTP ${response.status}: Failed to process ${type}`);
      }
    } catch (error) {
      const errorSource: Source = {
        ...newSource,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed'
      };
      
      onSourcesChange([
        ...sources.filter(s => s.id !== newSource.id),
        errorSource
      ]);
    }
  };

  const removeSource = (sourceId: string) => {
    onSourcesChange(sources.filter(s => s.id !== sourceId));
  };

  const getSourceIcon = (source: Source) => {
    if (source.status === 'processing') return '⏳';
    if (source.status === 'error') return '❌';
    
    switch (source.type) {
      case 'url': return '🔗';
      case 'pdf': return '📄';
      case 'screenshot': return '📷';
      default: return '📁';
    }
  };

  const getSourceStatusColor = (status: Source['status']) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <h3 className="font-semibold text-gray-800">Content Sources</h3>
            <span className="text-sm text-gray-500">({sources.length})</span>
          </div>
          
          <button
            onClick={() => setIsAddingSource(!isAddingSource)}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
          >
            + Add Source
          </button>
        </div>

        {/* Add Source Interface */}
        {isAddingSource && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addUrlSource}
                    disabled={!urlInput.trim() || isProcessingUrl}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                  >
                    {isProcessingUrl ? '⏳' : '🔗 Add'}
                  </button>
                </div>
              </div>

              {/* File Upload Options */}
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  📄 Add PDF
                </button>
                
                <button
                  onClick={() => screenshotInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                >
                  📷 Add Screenshot
                </button>
              </div>

              <button
                onClick={() => setIsAddingSource(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sources List */}
      <div className="p-4">
        {sources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📚</div>
            <div className="font-medium mb-1">No sources added yet</div>
            <div className="text-sm">Add URLs, PDFs, or screenshots to provide context for better AI content</div>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`border rounded-lg p-3 transition-colors ${getSourceStatusColor(source.status)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{getSourceIcon(source)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate pr-2" title={source.name}>
                        {source.name}
                      </div>
                      <div className="text-xs opacity-75 mt-1 truncate">
                        {source.type === 'url' && 'Website'}
                        {source.type === 'pdf' && 'PDF Document'}
                        {source.type === 'screenshot' && 'Screenshot'}
                        {source.status === 'processing' && ' • Processing...'}
                        {source.status === 'ready' && ` • ${source.content.length} characters extracted`}
                        {source.status === 'error' && ` • Error: ${source.error}`}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeSource(source.id)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Remove source"
                  >
                    ×
                  </button>
                </div>

                {/* Preview Content */}
                {source.status === 'ready' && source.content && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <div className="text-xs opacity-75 max-h-12 overflow-hidden leading-relaxed">
                      {/* Clean preview text to avoid displaying garbled characters */}
                      {source.content
                        .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F\s]/g, '') // Remove non-printable chars
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .substring(0, 200)
                        .trim()}
                      {source.content.length > 200 ? '...' : ''}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addFileSource(file, 'pdf');
        }}
        className="hidden"
      />
      
      <input
        ref={screenshotInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addFileSource(file, 'screenshot');
        }}
        className="hidden"
      />
    </div>
  );
}
