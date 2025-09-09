'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import jsPDF from 'jspdf';
import SourcesManager, { Source } from './SourcesManager';
import TokenUsageIndicator from './TokenUsageIndicator';

interface ContentEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  initialSources?: Source[];
  onTitleSuggestion?: (title: string) => void;
  initialRelevanceMessage?: string;
  title?: string;
}

interface AIAssistance {
  type: 'continue' | 'improve' | 'rewrite' | 'summarize' | 'expand';
  prompt?: string;
}

export default function ContentEditor({ initialContent = '', onContentChange, initialSources = [], onTitleSuggestion, initialRelevanceMessage, title }: ContentEditorProps) {
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [aiMenuPosition, setAiMenuPosition] = useState({ x: 0, y: 0 });
  const [wordCount, setWordCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [showSources, setShowSources] = useState(false);
  const [relevanceMessage, setRelevanceMessage] = useState<string | null>(initialRelevanceMessage || null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Ensure all formatting is enabled
        bold: {},
        italic: {},
        strike: {},
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {},
        orderedList: {},
        blockquote: {},
      }),
      Placeholder.configure({
        placeholder: 'Start writing your content here... You can select text to get AI assistance with improving, rewriting, or expanding specific sections.',
      }),
    ],
    content: initialContent,
    immediatelyRender: false, // Fix SSR hydration issues
    editable: true,
    injectCSS: false,
    onCreate: ({ editor }) => {
      // Editor initialized successfully
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const textContent = editor.getText();
      setWordCount(textContent.trim() ? textContent.split(/\s+/).filter(word => word.length > 0).length : 0);
      onContentChange?.(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const selection = editor.state.selection;
      if (!selection.empty) {
        const selectedText = editor.state.doc.textBetween(selection.from, selection.to);
        setSelectedText(selectedText.trim());
        
        // Calculate menu position
        const { from, to } = selection;
        try {
          const start = editor.view.coordsAtPos(from);
          const end = editor.view.coordsAtPos(to);
          
          // Calculate position relative to editor container
          const editorRect = editor.view.dom.getBoundingClientRect();
          const toolbarHeight = 60; // Approximate toolbar height + padding
          
          setAiMenuPosition({
            x: (start.left + end.right) / 2,
            y: Math.max(start.top - 50, editorRect.top + toolbarHeight + 10) // Ensure gap below toolbar
          });
          setShowAIMenu(true);
        } catch (e) {
          // Fallback if position calculation fails
          setShowAIMenu(true);
        }
      } else {
        setShowAIMenu(false);
        setShowOverflowMenu(false);
        setSelectedText('');
      }
    },
  });

  // Update content when initialContent changes
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);


  const handleAIAssist = async (assistance: AIAssistance) => {
    if (isAIGenerating || !editor) return;
    
    setIsAIGenerating(true);
    setShowAIMenu(false);

    try {
      // Get plain text content for API call
      const plainTextContent = editor.getText();
      
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: assistance.type,
          content: assistance.type === 'continue' ? plainTextContent : selectedText,
          context: plainTextContent,
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
        // Add new content at the end
        const currentContent = editor.getHTML();
        editor.commands.setContent(currentContent + '<br><br>' + result.content.replace(/\n/g, '<br>'));
      } else if (selectedText) {
        // Replace selected text with AI-improved version
        const { from, to } = editor.state.selection;
        editor.commands.deleteRange({ from, to });
        editor.commands.insertContentAt(from, result.content.replace(/\n/g, '<br>'));
      }

      // Handle title suggestion if provided
      if (result.suggestedTitle && onTitleSuggestion) {
        console.log('🏷️ Received title suggestion:', result.suggestedTitle);
        onTitleSuggestion(result.suggestedTitle);
      }

      // Handle relevance message if provided
      if (result.relevanceMessage) {
        console.log('📄 Source relevance message:', result.relevanceMessage);
        setRelevanceMessage(result.relevanceMessage);
      }
    } catch (error) {
      console.error('AI assistance error:', error);
      alert('AI assistance failed. Please try again.');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const exportToPDF = async () => {
    if (!editor) return;
    
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
      
      const documentTitle = title || "AI Generated Content";
      pdf.text(documentTitle, margin, margin + 10);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const date = new Date().toLocaleDateString();
      pdf.text(`Generated: ${date}`, margin, margin + 20);
      
      // Get plain text content from Tiptap editor
      const textContent = editor.getText();
      
      // Add content
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const lines = pdf.splitTextToSize(textContent, maxWidth);
      let yPosition = margin + 35;
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
      }
      
      // Save the PDF with the document title as filename
      const filename = title 
        ? `${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`
        : `content-${Date.now()}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Clear relevance message when sources change
  useEffect(() => {
    // Clear message when sources are added, removed, or their status changes
    setRelevanceMessage(null);
  }, [sources]);

  const getReadySources = () => sources.filter(s => s.status === 'ready');

  if (!isMounted || !editor) {
    return <div className="h-32 bg-gray-50 animate-pulse rounded">Loading editor...</div>;
  }

  return (
    <>
      {/* Tiptap Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          color: #374151 !important;
          padding: 24px !important;
          border: none !important;
          outline: none !important;
          overflow-y: auto;
          min-height: 300px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        /* Ensure formatting marks are visible */
        .ProseMirror strong,
        .ProseMirror b {
          font-weight: 700 !important;
        }

        .ProseMirror em,
        .ProseMirror i {
          font-style: italic !important;
        }

        .ProseMirror s {
          text-decoration: line-through !important;
        }

        .ProseMirror h1 {
          font-size: 1.8rem !important;
          font-weight: 700 !important;
          margin: 1rem 0 !important;
          line-height: 1.2 !important;
        }

        .ProseMirror h2 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin: 0.8rem 0 !important;
          line-height: 1.2 !important;
        }

        .ProseMirror h3 {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          margin: 0.6rem 0 !important;
          line-height: 1.2 !important;
        }

        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }

        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }

        .ProseMirror li {
          margin: 0.2rem 0 !important;
        }

        .ProseMirror blockquote {
          border-left: 4px solid #6366f1 !important;
          padding-left: 1rem !important;
          margin: 1rem 0 !important;
          font-style: italic !important;
          color: #6b7280 !important;
          background: #f8fafc !important;
          border-radius: 0 4px 4px 0 !important;
        }
        .tiptap-toolbar {
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border-radius: 8px 8px 0 0;
        }
        .tiptap-btn {
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          transition: all 0.15s ease;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          min-width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tiptap-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
          color: #111827;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
        }
        .tiptap-btn:active {
          transform: translateY(0px);
        }
        .tiptap-btn.is-active {
          background: #3b82f6 !important;
          color: #ffffff !important;
          border-color: #2563eb !important;
          box-shadow: 0 2px 8px 0 rgba(59, 130, 246, 0.4) !important;
          font-weight: 700 !important;
          transform: none !important;
        }
        .tiptap-btn:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    
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
              disabled={isAIGenerating || !editor.getText().trim()}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isAIGenerating || !editor.getText().trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isAIGenerating ? '✨ Writing...' : '✨ Continue Writing'}
            </button>

            {/* Export to PDF */}
            <button
              onClick={exportToPDF}
              disabled={isExporting || !editor.getText().trim()}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isExporting || !editor.getText().trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isExporting ? '📄 Exporting...' : '📄 Export PDF'}
            </button>
          </div>
        </div>

        {/* Relevance Message Notification */}
        {relevanceMessage && (
          <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-amber-600 text-sm">⚠️</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-800 mb-1">Source Relevance Note</div>
                <div className="text-sm text-amber-700">{relevanceMessage}</div>
              </div>
              <button
                onClick={() => setRelevanceMessage(null)}
                className="text-amber-600 hover:text-amber-800 text-sm ml-2"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}

      {/* Tiptap Rich Text Editor */}
      <div className="flex-1 relative flex flex-col">
        {/* Tiptap Toolbar */}
        <div className="tiptap-toolbar">
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              if (editor) {
                editor.chain().focus().toggleBold().run();
              }
            }}
            className={`tiptap-btn ${editor?.isActive('bold') ? 'is-active' : ''}`}
            title="Bold"
            type="button"
          >
            <strong>B</strong>
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              if (editor) {
                editor.chain().focus().toggleItalic().run();
              }
            }}
            className={`tiptap-btn ${editor?.isActive('italic') ? 'is-active' : ''}`}
            title="Italic"
            type="button"
          >
            <em>I</em>
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              if (editor) {
                editor.chain().focus().toggleStrike().run();
              }
            }}
            className={`tiptap-btn ${editor?.isActive('strike') ? 'is-active' : ''}`}
            title="Strike"
            type="button"
          >
            <s>S</s>
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
            className={`tiptap-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
            title="Header 1"
            type="button"
          >
            H1
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
            className={`tiptap-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            title="Header 2"
            type="button"
          >
            H2
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
            className={`tiptap-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
            title="Header 3"
            type="button"
          >
            H3
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              editor.chain().focus().toggleBulletList().run();
            }}
            className={`tiptap-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            title="Bullet List"
            type="button"
          >
            • List
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              editor.chain().focus().toggleOrderedList().run();
            }}
            className={`tiptap-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            title="Numbered List"
            type="button"
          >
            1. List
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              editor.chain().focus().toggleBlockquote().run();
            }}
            className={`tiptap-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            title="Quote"
            type="button"
          >
            Quote
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAIMenu(false);
              setShowOverflowMenu(false);
              editor.chain().focus().clearNodes().unsetAllMarks().run();
            }}
            className="tiptap-btn"
            title="Clear Format"
            type="button"
          >
            Clear
          </button>
        </div>

        {/* Tiptap Editor Content */}
        <div 
          className="flex-1 relative"
          onContextMenu={(e) => {
            // Allow context menu on text selection, but prevent on toolbar area
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <EditorContent editor={editor} className="h-full" />
        </div>

        {/* Compact AI Menu */}
        {showAIMenu && selectedText && (
          <div
            className="fixed bg-white rounded-full shadow-lg border border-gray-200 z-50 px-2 py-1 flex items-center gap-1"
            style={{
              left: aiMenuPosition.x - 80,
              top: aiMenuPosition.y - 25,
            }}
          >
            {/* Primary Actions */}
            <button
              onClick={() => handleAIAssist({ type: 'improve' })}
              className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center text-blue-600 transition-colors"
              disabled={isAIGenerating}
              title="Improve Text"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            
            <button
              onClick={() => handleAIAssist({ type: 'rewrite' })}
              className="w-8 h-8 rounded-full hover:bg-purple-50 flex items-center justify-center text-purple-600 transition-colors"
              disabled={isAIGenerating}
              title="Rewrite"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>

            <button
              onClick={() => handleAIAssist({ type: 'expand' })}
              className="w-8 h-8 rounded-full hover:bg-green-50 flex items-center justify-center text-green-600 transition-colors"
              disabled={isAIGenerating}
              title="Expand"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
              </svg>
            </button>

            {/* Overflow Menu */}
            <div className="relative">
              <button
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"
                title="More options"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="5" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="19" r="2" fill="currentColor"/>
                </svg>
              </button>
              
              {showOverflowMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      handleAIAssist({ type: 'summarize' });
                      setShowOverflowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                    disabled={isAIGenerating}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <line x1="10" y1="9" x2="8" y2="9"/>
                    </svg>
                    Summarize
                  </button>
                </div>
              )}
            </div>
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
            <span>Characters: {editor.storage.characterCount?.characters() || editor.getText().length}</span>
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
            additionalContent={editor.getText()}
            className="flex-shrink-0"
          />
        </div>
      )}
    </div>
    </>
  );
}
