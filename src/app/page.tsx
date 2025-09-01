'use client';

import { useState } from 'react';
import UploadButton from '@/components/UploadButton';
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
      <div className="flex justify-center items-center py-12">
        <div className="flex items-center gap-4">
          <span className="text-4xl">📄</span>
          <h1 className="text-4xl font-bold text-gray-900">
            Agentic PDF Processor
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Search Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            What would you like to do with your documents?
          </h2>
          
          <div className="flex gap-4 items-center justify-center max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="Ask me anything about your PDFs, or describe what you need..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-400 focus:outline-none transition-colors"
            />
            <UploadButton
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
          
          <p className="text-center text-gray-600 mt-4">
            Try: "Summarize this document", "Extract key points", or "Convert to presentation"
          </p>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-center text-gray-800 mb-8">
            Choose a feature to get started
          </h3>
          
          <div className="flex gap-6 justify-center flex-wrap max-w-6xl mx-auto">
            
            {/* Content Writing */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 w-60 h-44 cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex flex-col h-full justify-between text-center">
                <div className="text-4xl mb-2">🎨</div>
                <div>
                  <h4 className="text-white text-lg font-bold mb-2">Content Writing</h4>
                  <p className="text-white/90 text-sm leading-tight">
                    AI-powered content generation and writing assistance
                  </p>
                </div>
              </div>
            </div>

            {/* PDF Editor */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 w-60 h-44 cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex flex-col h-full justify-between text-center">
                <div className="text-4xl mb-2">✏️</div>
                <div>
                  <h4 className="text-white text-lg font-bold mb-2">PDF Editor</h4>
                  <p className="text-white/90 text-sm leading-tight">
                    Advanced PDF editing and manipulation tools
                  </p>
                </div>
              </div>
            </div>

            {/* Gmail Agent */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 w-60 h-44 cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex flex-col h-full justify-between text-center">
                <div className="text-4xl mb-2">📧</div>
                <div>
                  <h4 className="text-white text-lg font-bold mb-2">Gmail Agent</h4>
                  <p className="text-white/90 text-sm leading-tight">
                    Intelligent email management and automation
                  </p>
                </div>
              </div>
            </div>

            {/* E-signature */}
            <div className="bg-gradient-to-br from-cyan-400 to-pink-400 rounded-2xl p-6 w-60 h-44 cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex flex-col h-full justify-between text-center">
                <div className="text-4xl mb-2">✍️</div>
                <div>
                  <h4 className="text-gray-800 text-lg font-bold mb-2">E-signature</h4>
                  <p className="text-gray-700 text-sm leading-tight">
                    Digital signature and document signing
                  </p>
                </div>
              </div>
            </div>

            {/* Intelligence */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 w-60 h-44 cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex flex-col h-full justify-between text-center">
                <div className="text-4xl mb-2">🧠</div>
                <div>
                  <h4 className="text-white text-lg font-bold mb-2">Intelligence</h4>
                  <p className="text-white/90 text-sm leading-tight">
                    AI insights and document analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
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