'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PDFViewer from '@/components/PDFViewer';

interface ContentOverlayProps {
  isVisible: boolean;
  content: string;
  isStreaming: boolean;
  onEdit: () => void;
  onClose: () => void;
  position: { x: number; y: number };
  onDrag: (x: number, y: number) => void;
}

function ContentOverlay({ isVisible, content, isStreaming, onEdit, onClose, position, onDrag }: ContentOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      onDrag(newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      data-streaming={isStreaming}
      className="fixed bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-w-md w-80 max-h-96 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Header */}
      <div
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="font-semibold">AI Generated Content</h3>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <div className="flex items-center gap-1 text-sm">
                <span className="animate-pulse">●</span>
                <span>Writing...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-64">
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
          {content || 'Starting to generate content...'}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 p-3 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {content.length} characters
        </div>
        <button
          onClick={onEdit}
          disabled={isStreaming}
          className={`px-3 py-1 rounded text-sm font-medium transition-all ${
            isStreaming
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          📝 Edit
        </button>
      </div>
    </div>
  );
}

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 50, y: 100 });
  const [contentGenerationStarted, setContentGenerationStarted] = useState(false);
  const streamingCancelledRef = useRef(false);
  const currentGenerationIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Get URL parameters
    const urlPrompt = searchParams.get('prompt');
    const urlMode = searchParams.get('mode');
    const hasFile = searchParams.get('hasFile');
    const documentId = searchParams.get('documentId');

    if (urlPrompt) setPrompt(urlPrompt);
    if (urlMode) setMode(urlMode);

    console.log('🎯 Editor loaded with:', { urlPrompt, urlMode, hasFile, documentId });

    // Load PDF if document ID is provided
    if (documentId) {
      loadDocumentById(documentId);
    } else if (!hasFile) {
      // Load a sample PDF for demo purposes when no specific document
      loadSamplePDF();
    }

    // Auto-start content generation (prevent multiple calls)
    if (urlPrompt && !contentGenerationStarted) {
      console.log('🎯 Scheduling content generation for:', urlPrompt);
      setContentGenerationStarted(true);
      setTimeout(() => {
        startContentGeneration(urlPrompt);
      }, 1000);
    }
  }, [searchParams]);

  const loadDocumentById = async (documentId: string) => {
    try {
      console.log('📄 Loading document:', documentId);
      
      // Get document details from API
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const result = await response.json();
        const document = result.document;
        
        if (document?.file_path) {
          // Set PDF URL from Supabase storage
          setPdfUrl(document.file_path);
          console.log('✅ Document loaded from database:', document.filename);
        }
      } else {
        console.error('❌ Failed to load document');
      }
    } catch (error) {
      console.error('❌ Error loading document:', error);
    }
  };

  const loadSamplePDF = () => {
    // For demo purposes, try to load any recent document
    fetch('/api/documents')
      .then(response => response.json())
      .then(result => {
        if (result.success && result.documents.length > 0) {
          const latestDoc = result.documents[0];
          if (latestDoc.file_path) {
            setPdfUrl(latestDoc.file_path);
            console.log('✅ Loaded sample PDF:', latestDoc.filename);
          }
        } else {
          console.log('ℹ️ No documents available for preview');
        }
      })
      .catch(error => {
        console.log('ℹ️ Could not load sample PDF:', error);
      });
  };

  const startContentGeneration = async (userPrompt: string) => {
    // Generate unique ID for this generation
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Prevent multiple concurrent generations
    if (isStreaming) {
      console.log('⚠️ Content generation already in progress, skipping...');
      return;
    }

    console.log('🚀 Starting content generation:', generationId, 'for prompt:', userPrompt);
    
    // Set current generation ID
    currentGenerationIdRef.current = generationId;
    
    // Reset cancellation flag
    streamingCancelledRef.current = false;
    
    setShowOverlay(true);
    setIsStreaming(true);
    setGeneratedContent(''); // Clear any existing content

    // Simulate streaming content generation
    const sampleContent = `# ${getSampleTitle(userPrompt)}

${getSampleContent(userPrompt)}

## Key Points
- Professional and engaging content
- AI-powered generation based on your prompt
- Fully editable once generation completes

## Next Steps
This content is now ready for your review and editing. You can modify any part to match your exact requirements.`;

    console.log('📝 Content to stream:', sampleContent.length, 'characters');

    try {
      // Use word-by-word streaming instead of character-by-character to avoid React batching issues
      const words = sampleContent.split(' ');
      console.log('🔤 Starting word-by-word streaming for', words.length, 'words');
      
      let currentContent = '';
      for (let i = 0; i < words.length; i++) {
        // Check if streaming was cancelled or generation ID changed (React Strict Mode protection)
        if (streamingCancelledRef.current || currentGenerationIdRef.current !== generationId) {
          console.log('🛑 Streaming cancelled or superseded by newer generation');
          return; // Exit early without setting isStreaming false
        }
        
        // Add word with space (except for last word)
        currentContent += words[i] + (i < words.length - 1 ? ' ' : '');
        
        // Update content in batches to avoid React state issues
        setGeneratedContent(currentContent);
        
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay per word
        
        // Progress tracking every 20 words
        if (i % 20 === 0 && i > 0) {
          console.log(`📊 Streaming progress [${generationId}]: ${i}/${words.length} (${Math.round(i/words.length*100)}%)`);
        }
      }
      
      console.log('✅ Word streaming complete for generation:', generationId);
    } catch (error) {
      console.error('❌ Streaming error:', error);
    }

    // Only complete if this is still the current generation
    if (currentGenerationIdRef.current === generationId) {
      setIsStreaming(false);
      console.log('✅ Content generation complete:', generationId);
    } else {
      console.log('⚠️ Generation superseded, not completing:', generationId);
    }
  };

  const getSampleTitle = (userPrompt: string): string => {
    if (userPrompt.toLowerCase().includes('blog')) return 'Blog Post: AI Content Creation';
    if (userPrompt.toLowerCase().includes('email')) return 'Professional Email Draft';
    if (userPrompt.toLowerCase().includes('summary')) return 'Document Summary';
    return 'AI Generated Content';
  };

  const getSampleContent = (userPrompt: string): string => {
    return `Based on your request: "${userPrompt}"

I've generated professional content that addresses your specific needs. This content combines AI-powered insights with best practices for effective communication.

The generated content is structured to be immediately useful while maintaining flexibility for your specific requirements. You can edit any section to better match your voice and objectives.`;
  };

  const handleEdit = () => {
    console.log('📝 Opening editor for content:', generatedContent);
    // Here we would open a rich text editor or navigate to an editor page
    alert('Opening editor... (This would open a rich text editor in the full implementation)');
  };

  const handleCloseOverlay = () => {
    // Cancel any ongoing streaming
    streamingCancelledRef.current = true;
    currentGenerationIdRef.current = null; // Clear generation ID
    setIsStreaming(false);
    setShowOverlay(false);
    console.log('🔒 Overlay closed, streaming cancelled');
  };

  const handleDragOverlay = (x: number, y: number) => {
    setOverlayPosition({ x, y });
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
            <h1 className="text-xl font-semibold text-gray-800">PDF Editor</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {mode === 'generate' ? '✨ Generating' : '📖 Viewing'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* PDF Viewer Area */}
        <div className="flex-1 relative">
          <PDFViewer 
            pdfUrl={pdfUrl || undefined}
            pdfFile={pdfFile || undefined}
            className="h-full rounded-lg shadow-sm border"
          />

          {/* Floating Content Overlay */}
          <ContentOverlay
            isVisible={showOverlay}
            content={generatedContent}
            isStreaming={isStreaming}
            onEdit={handleEdit}
            onClose={handleCloseOverlay}
            position={overlayPosition}
            onDrag={handleDragOverlay}
          />
        </div>
      </div>

      {/* Current Prompt Display */}
      {prompt && (
        <div className="bg-blue-50 border-t p-4">
          <div className="container mx-auto">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 text-lg flex-shrink-0">💬</span>
              <div>
                <div className="font-medium text-blue-800 mb-1">Current Request:</div>
                <div className="text-blue-700 text-sm">{prompt}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
