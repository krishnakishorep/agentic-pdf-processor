'use client';

import { useState } from 'react';
import Link from 'next/link';
import PromptInterface from '@/components/PromptInterface';
import RecentActivity from '@/components/RecentActivity';

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const handleUploadSuccess = (document: any) => {
    console.log('Document uploaded:', document);
    setNotification({
      message: `${document.filename} uploaded successfully!`,
      type: 'success'
    });
    // Trigger refresh of recent activity
    setRefreshTrigger(prev => prev + 1);
    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    setNotification({
      message: error,
      type: 'error'
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePromptSubmit = (prompt: string, file?: File) => {
    console.log('📝 Prompt submitted from home:', prompt);
    console.log('📎 File attached:', file?.name);
    
    // Show success notification
    setNotification({
      message: 'Processing your request...',
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Header */}
      <div className="text-center py-12">
        <div className="flex justify-center items-center gap-4 mb-4">
          <span className="text-4xl">✍️</span>
          <h1 className="text-4xl font-bold text-gray-900">
            AI Content Writer
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create compelling content with AI assistance. Write, improve, and export professional documents with ease.
        </p>
        
        {/* Navigation Pills */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/write"
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium"
          >
            <span>✨</span>
            <span>Start Writing</span>
          </Link>
          <Link
            href="/editor"
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors font-medium"
          >
            <span>📄</span>
            <span>PDF Editor</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 max-w-7xl">
        {/* AI Content Assistant */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Quick Start: Tell AI What to Write
          </h2>
          
          <PromptInterface
            onPromptSubmit={handlePromptSubmit}
          />
        </div>



        {/* Recent Activity */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-center text-gray-800 mb-8">
            Recent Activity
          </h3>
          
          <RecentActivity refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}