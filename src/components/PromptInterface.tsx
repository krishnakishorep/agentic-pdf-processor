'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SourcesManager, { Source } from './SourcesManager';

interface PromptInterfaceProps {
  onPromptSubmit?: (prompt: string, file?: File) => void;
}

export default function PromptInterface({ onPromptSubmit }: PromptInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [showSources, setShowSources] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    console.log('🚀 Prompt submitted:', prompt);
    console.log('📎 File attached:', selectedFile?.name);
    
    setIsProcessing(true);

    try {
      const params = new URLSearchParams({
        prompt: prompt.trim(),
        mode: 'generate',
        hasSources: sources.length > 0 ? 'true' : 'false'
      });

      // If file is selected, upload it first and get document ID
      if (selectedFile) {
        console.log('📤 Uploading file before navigation...');
        params.set('hasFile', 'true');
        
        const documentId = await uploadFileAndGetId(selectedFile);
        if (documentId) {
          params.set('documentId', documentId);
          console.log('✅ File uploaded, document ID:', documentId);
        }
      }

      // Store sources in localStorage for the write page to use
      if (sources.length > 0) {
        console.log('📚 Storing sources in localStorage:', sources.map(s => ({ name: s.name, type: s.type, status: s.status, hasContent: !!s.content })));
        localStorage.setItem('prompt-sources', JSON.stringify(sources));
      } else {
        localStorage.removeItem('prompt-sources');
      }

      // Navigate to content writer
      router.push(`/write?${params.toString()}`);
      
      // Optional: Call parent callback
      onPromptSubmit?.(prompt, selectedFile || undefined);
      
    } catch (error) {
      console.error('❌ Prompt processing failed:', error);
      setIsProcessing(false);
    }
  };

  const uploadFileAndGetId = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading PDF file...');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ File uploaded successfully:', result.document.id);
        return result.document.id;
      } else {
        console.error('❌ Upload failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      return null;
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file);
      console.log('📎 PDF selected:', file.name);
    } else {
      alert('Please select a PDF file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileSelect(pdfFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getReadySources = () => sources.filter(s => s.status === 'ready');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Sources Panel */}
      {showSources && (
        <SourcesManager
          sources={sources}
          onSourcesChange={setSources}
          className="max-h-96 overflow-y-auto"
        />
      )}

      {/* Main Prompt Area */}
      <div
        className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* File Attachment and Sources Display */}
        {(selectedFile || getReadySources().length > 0) && (
          <div className="px-6 pt-4 flex flex-wrap gap-2">
            {selectedFile && (
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
                <span>📎</span>
                <span className="font-medium">{selectedFile.name}</span>
                <button
                  onClick={removeFile}
                  className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </div>
            )}
            {getReadySources().length > 0 && (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
                <span>📚</span>
                <span className="font-medium">{getReadySources().length} source{getReadySources().length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => setShowSources(true)}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
                  title="View sources"
                >
                  👁
                </button>
              </div>
            )}
          </div>
        )}

        {/* Prompt Input Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-end gap-4">
            {/* Sources and File Upload Buttons */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowSources(!showSources)}
                className={`p-3 rounded-lg transition-colors ${
                  showSources || sources.length > 0
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Add sources"
              >
                <span className="text-lg">📚</span>
              </button>
              
              <button
                type="button"
                onClick={openFileDialog}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Attach PDF"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>

            {/* Text Input */}
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like me to write today? (e.g., 'Write a blog post about AI trends' or 'Create a professional email about project updates')"
                className="w-full p-4 border-0 resize-none focus:outline-none text-gray-800 placeholder-gray-500"
                rows={3}
                style={{ minHeight: '80px' }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!prompt.trim() || isProcessing}
              className={`flex-shrink-0 p-3 rounded-lg font-semibold transition-all ${
                prompt.trim() && !isProcessing
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span className="hidden sm:inline">Processing...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>🚀</span>
                  <span className="hidden sm:inline">Generate</span>
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center">
            <div className="text-blue-600 text-center">
              <div className="text-4xl mb-2">📎</div>
              <div className="font-semibold">Drop your PDF here</div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      {/* Example Prompts */}
      <div className="mt-8 text-center">
        <h3 className="text-gray-600 font-medium mb-4">Try these examples:</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            "Write a blog post about AI trends",
            "Create a professional email proposal",
            "Draft a social media campaign",
            "Write a product announcement"
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
