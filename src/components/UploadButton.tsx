'use client';

import { useState, useRef, useEffect } from 'react';
import { useDocumentEvents } from '@/hooks/useDocumentEvents';

interface UploadButtonProps {
  onUploadStart?: () => void;
  onUploadSuccess?: (document: any) => void;
  onUploadError?: (error: string) => void;
}

export default function UploadButton({ 
  onUploadStart, 
  onUploadSuccess, 
  onUploadError 
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    status: string;
    message: string;
    progress: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use SSE hook for real-time status updates
  const { lastEvent, isConnected } = useDocumentEvents(currentDocumentId);

  // Handle SSE events
  useEffect(() => {
    if (!lastEvent) return;

    console.log('📨 UploadButton received SSE event:', lastEvent);

    setProcessingStatus({
      status: lastEvent.status,
      message: lastEvent.message,
      progress: lastEvent.progress || 0
    });

    // Handle completion
    if (lastEvent.status === 'completed') {
      console.log('🎉 COMPLETION EVENT RECEIVED:', lastEvent);
      setTimeout(() => {
        setCurrentDocumentId(null);
        setProcessingStatus(null);
        onUploadSuccess?.(lastEvent.data);
      }, 2000); // Show success for 2 seconds
    } 
    
    // Handle failure
    else if (lastEvent.status === 'failed') {
      setTimeout(() => {
        setCurrentDocumentId(null);
        setProcessingStatus(null);
        onUploadError?.(lastEvent.message);
      }, 3000); // Show error for 3 seconds
    }
  }, [lastEvent]); // Removed function deps to prevent infinite loop

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      onUploadError?.('Please select a PDF file');
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      onUploadError?.('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ Upload successful:', result);
      
      // Start listening to SSE events for this document
      setCurrentDocumentId(result.document.id);
      setProcessingStatus({
        status: 'uploaded',
        message: `File "${file.name}" uploaded successfully`,
        progress: 25
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const isProcessing = isUploading || processingStatus !== null;
  const showProgress = processingStatus !== null;

  const getStatusIcon = () => {
    if (isUploading) return '⏳';
    if (!processingStatus) return '📤';
    
    switch (processingStatus.status) {
      case 'uploaded': return '✅';
      case 'processing': return '🔄';
      case 'analyzing': return '🧠';
      case 'completed': return '🎉';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  const getStatusText = () => {
    if (isUploading) return 'Uploading...';
    if (!processingStatus) return 'Upload PDF';
    
    return processingStatus.message || processingStatus.status;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className="w-full max-w-md">
        <button
          onClick={handleButtonClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          disabled={isProcessing}
          className={`
            w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl 
            hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl 
            flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed
            ${isUploading ? 'animate-pulse' : ''}
          `}
        >
          <span className="text-lg">
            {getStatusIcon()}
          </span>
          <span className="flex-1 text-left">
            {getStatusText()}
          </span>
          {showProgress && (
            <span className="text-sm opacity-75">
              {processingStatus.progress}%
            </span>
          )}
        </button>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                processingStatus.status === 'completed' 
                  ? 'bg-green-500' 
                  : processingStatus.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${processingStatus.progress}%` }}
            />
          </div>
        )}

        {/* Connection Status */}
        {showProgress && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            {isConnected ? 'Real-time updates active' : 'Connecting...'}
          </div>
        )}
      </div>
    </>
  );
}
