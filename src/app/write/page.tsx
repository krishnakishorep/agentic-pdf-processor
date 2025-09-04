'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ContentEditor from '@/components/ContentEditor';
import { Source } from '@/components/SourcesManager';

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialContent, setInitialContent] = useState('');
  const [title, setTitle] = useState('');
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
  const [initialSources, setInitialSources] = useState<Source[]>([]);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    const mode = searchParams.get('mode');
    const hasSources = searchParams.get('hasSources') === 'true';

    // Load sources from localStorage if available
    if (hasSources) {
      try {
        const savedSources = localStorage.getItem('prompt-sources');
        if (savedSources) {
          const sources = JSON.parse(savedSources);
          setInitialSources(sources);
          localStorage.removeItem('prompt-sources'); // Clean up
        }
      } catch (error) {
        console.error('Failed to load sources:', error);
      }
    }

    if (prompt && mode === 'generate') {
      setIsGeneratingInitial(true);
      generateInitialContent(prompt);
    }
  }, [searchParams]);

  const generateInitialContent = async (prompt: string) => {
    try {
      console.log('🚀 Generating initial content from prompt:', prompt);
      
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sources: initialSources.filter(s => s.status === 'ready') })
      });

      if (response.ok) {
        const result = await response.json();
        setInitialContent(result.content);
        setTitle(result.title || 'AI Generated Content');
        console.log('✅ Initial content generated');
      } else {
        console.error('❌ Failed to generate initial content');
        setInitialContent(`# ${getDefaultTitle(prompt)}\n\n${getDefaultContent(prompt)}`);
      }
    } catch (error) {
      console.error('❌ Error generating initial content:', error);
      setInitialContent(`# ${getDefaultTitle(prompt)}\n\n${getDefaultContent(prompt)}`);
    } finally {
      setIsGeneratingInitial(false);
    }
  };

  const getDefaultTitle = (prompt: string): string => {
    if (prompt.toLowerCase().includes('blog')) return 'Blog Post';
    if (prompt.toLowerCase().includes('email')) return 'Professional Email';
    if (prompt.toLowerCase().includes('article')) return 'Article';
    if (prompt.toLowerCase().includes('letter')) return 'Letter';
    if (prompt.toLowerCase().includes('proposal')) return 'Proposal';
    return 'AI Generated Content';
  };

  const getDefaultContent = (prompt: string): string => {
    return `Based on your request: "${prompt}"\n\n` +
           `I'll help you create compelling content. Let me start with some ideas:\n\n` +
           `## Introduction\n\n` +
           `[Write your introduction here. Use the AI assist features to help expand and improve your content.]\n\n` +
           `## Main Content\n\n` +
           `[This is where your main content will go. Select any text to get AI suggestions for improvement, rewriting, or expansion.]\n\n` +
           `## Conclusion\n\n` +
           `[Add your closing thoughts here.]\n\n` +
           `---\n\n` +
           `💡 **Tip**: Select any text in the editor to get AI assistance options, or click "Continue Writing" to extend your content automatically.`;
  };

  const handleContentChange = (content: string) => {
    // Could save to localStorage or backend here
    localStorage.setItem('draft-content', content);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-800">AI Content Writer</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              ✍️ Writing Mode
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 container mx-auto px-6 py-6">
        {/* Title Input */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your document title..."
            className="w-full text-2xl font-bold text-gray-800 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent py-2"
          />
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-200px)]">
          {isGeneratingInitial ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-bounce">✨</div>
                <div className="text-xl font-medium text-gray-800 mb-2">Generating your content...</div>
                <div className="text-gray-600">AI is crafting the perfect starting point for you</div>
              </div>
            </div>
          ) : (
            <ContentEditor
              initialContent={initialContent}
              onContentChange={handleContentChange}
              initialSources={initialSources}
            />
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 border-t px-6 py-4">
        <div className="container mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-blue-500 text-lg flex-shrink-0">💡</span>
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Writing Tips:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-blue-700">
                <div>• Select text for AI assistance options</div>
                <div>• Use "Continue Writing" to extend content</div>
                <div>• Export to PDF when finished</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
