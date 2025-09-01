'use client';

import { useState, useRef } from 'react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onUploadSuccess?.(result.document);

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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <button
        onClick={handleButtonClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        disabled={isUploading}
        className={`
          px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl 
          hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl 
          flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
          ${isUploading ? 'animate-pulse' : ''}
        `}
      >
        <span className="text-lg">
          {isUploading ? '⏳' : '📤'}
        </span>
        {isUploading ? 'Uploading...' : 'Upload PDF'}
      </button>
    </>
  );
}
