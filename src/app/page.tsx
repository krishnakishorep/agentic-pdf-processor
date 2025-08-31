'use client';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
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
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2">
              <span className="text-lg">📤</span>
              Upload PDF
            </button>
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
          
          <div className="bg-white rounded-2xl p-6 shadow-lg max-w-3xl mx-auto">
            {/* Document 1 */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl">📄</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Marketing_Proposal.pdf</h4>
                <p className="text-gray-600 text-sm">Content extracted</p>
              </div>
              <span className="text-gray-500 text-sm">2 hours ago</span>
            </div>

            {/* Document 2 */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl">📄</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Contract_2024.pdf</h4>
                <p className="text-gray-600 text-sm">Signature added</p>
              </div>
              <span className="text-gray-500 text-sm">5 hours ago</span>
            </div>

            {/* Document 3 */}
            <div className="flex items-center gap-4">
              <span className="text-2xl">📄</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Research_Report.pdf</h4>
                <p className="text-gray-600 text-sm">Summary generated</p>
              </div>
              <span className="text-gray-500 text-sm">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}