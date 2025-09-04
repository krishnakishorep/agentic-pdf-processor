'use client';

import { useState, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import SourcesManager, { Source } from './SourcesManager';
import TokenUsageIndicator from './TokenUsageIndicator';

interface ContentEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  initialSources?: Source[];
  onTitleSuggestion?: (title: string) => void;
}

interface AIAssistance {
  type: 'continue' | 'improve' | 'rewrite' | 'summarize' | 'expand';
  prompt?: string;
}

export default function ContentEditor({ initialContent = '', onContentChange, initialSources = [], onTitleSuggestion }: ContentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiMenuPosition, setAiMenuPosition] = useState({ x: 0, y: 0 });
  const [wordCount, setWordCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [showSources, setShowSources] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setWordCount(newContent.trim().split(/\s+/).filter(word => word.length > 0).length);
    onContentChange?.(newContent);
  }, [onContentChange]);

  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selected = content.substring(start, end);
      setSelectedText(selected);
      
      // Calculate menu position
      const rect = textarea.getBoundingClientRect();
      setAiMenuPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top - 10
      });
      setShowAIMenu(true);
    } else {
      setShowAIMenu(false);
    }
  };

  const handleAIAssist = async (assistance: AIAssistance) => {
    if (isAIGenerating) return;
    
    setIsAIGenerating(true);
    setShowAIMenu(false);

    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: assistance.type,
          content: assistance.type === 'continue' ? content : selectedText,
          context: content,
          sources: sources.filter(s => s.status === 'ready').map(s => ({
            type: s.type,
            name: s.name,
            content: s.content
          })),
          prompt: assistance.prompt
        })
      });

      if (!response.ok) {
        throw new Error('AI assistance failed');
      }

      const result = await response.json();
      
      if (assistance.type === 'continue') {
        updateContent(content + '\n\n' + result.content);
      } else if (selectedText && textareaRef.current) {
        // Replace selected text with AI-improved version
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + result.content + content.substring(end);
        updateContent(newContent);
      }

      // Handle title suggestion if provided
      if (result.suggestedTitle && onTitleSuggestion) {
        console.log('🏷️ Received title suggestion:', result.suggestedTitle);
        onTitleSuggestion(result.suggestedTitle);
      }
    } catch (error) {
      console.error('AI assistance error:', error);
      alert('AI assistance failed. Please try again.');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7;
      const maxWidth = pageWidth - (margin * 2);
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      
      const title = "AI Generated Content";
      pdf.text(title, margin, margin + 10);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const date = new Date().toLocaleDateString();
      pdf.text(`Generated: ${date}`, margin, margin + 20);
      
      // Add content
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const lines = pdf.splitTextToSize(content, maxWidth);
      let yPosition = margin + 35;
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
      }
      
      // Save the PDF
      pdf.save(`content-${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getReadySources = () => sources.filter(s => s.status === 'ready');

  return (
    <div className="flex h-full gap-4">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">✍️ Content Editor</h2>
            <div className="text-sm text-gray-500">
              {wordCount} words
            </div>
            {getReadySources().length > 0 && (
              <div className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                📚 {getReadySources().length} source{getReadySources().length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sources Toggle */}
            <button
              onClick={() => setShowSources(!showSources)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              📚 Sources
            </button>

            {/* AI Actions */}
            <button
              onClick={() => handleAIAssist({ type: 'continue' })}
              disabled={isAIGenerating || !content.trim()}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isAIGenerating || !content.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isAIGenerating ? '✨ Writing...' : '✨ Continue Writing'}
            </button>

            {/* Export to PDF */}
            <button
              onClick={exportToPDF}
              disabled={isExporting || !content.trim()}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isExporting || !content.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isExporting ? '📄 Exporting...' : '📄 Export PDF'}
            </button>
          </div>
        </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => updateContent(e.target.value)}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder="Start writing your content here... You can select text to get AI assistance with improving, rewriting, or expanding specific sections."
          className="w-full h-full p-6 resize-none border-0 focus:outline-none text-gray-800 leading-relaxed font-mono text-sm"
          style={{ minHeight: '400px' }}
        />

        {/* AI Menu */}
        {showAIMenu && selectedText && (
          <div
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-2"
            style={{
              left: aiMenuPosition.x - 100,
              top: aiMenuPosition.y - 60,
              width: '200px'
            }}
          >
            <div className="text-xs text-gray-500 mb-2 px-2">
              AI Assist: "{selectedText.substring(0, 30)}..."
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleAIAssist({ type: 'improve' })}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors"
                disabled={isAIGenerating}
              >
                🎯 Improve Text
              </button>
              <button
                onClick={() => handleAIAssist({ type: 'rewrite' })}
                className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 rounded transition-colors"
                disabled={isAIGenerating}
              >
                ✏️ Rewrite
              </button>
              <button
                onClick={() => handleAIAssist({ type: 'expand' })}
                className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 rounded transition-colors"
                disabled={isAIGenerating}
              >
                📝 Expand
              </button>
              <button
                onClick={() => handleAIAssist({ type: 'summarize' })}
                className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 rounded transition-colors"
                disabled={isAIGenerating}
              >
                📋 Summarize
              </button>
            </div>
            <button
              onClick={() => setShowAIMenu(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full text-xs flex items-center justify-center"
            >
              ×
            </button>
          </div>
        )}

        {/* AI Generation Overlay */}
        {isAIGenerating && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-80 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-lg border">
              <div className="flex items-center gap-3">
                <div className="animate-spin text-2xl">🤖</div>
                <div>
                  <div className="font-medium text-gray-800">AI is working...</div>
                  <div className="text-sm text-gray-600">Generating content based on your request</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Status Bar */}
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
          <div>Select text to get AI assistance • Click "Continue Writing" to extend content</div>
          <div className="flex items-center gap-4">
            <span>Characters: {content.length}</span>
            <span>Words: {wordCount}</span>
          </div>
        </div>
      </div>

      {/* Sources Panel */}
      {showSources && (
        <div className="w-96 flex-shrink-0 space-y-4">
          <SourcesManager
            sources={sources}
            onSourcesChange={setSources}
            className="flex-1"
          />
          
          {/* Token Usage Indicator */}
          <TokenUsageIndicator
            sources={sources.filter(s => s.status === 'ready')}
            additionalContent={content}
            className="flex-shrink-0"
          />
        </div>
      )}
    </div>
  );
}
