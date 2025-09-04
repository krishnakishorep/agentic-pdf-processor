'use client';

import { useEffect, useRef, useState } from 'react';

// Import PDF.js only on client-side to avoid SSR issues
let pdfjsLib: any = null;

// Configure PDF.js worker - Use local worker file
const initializePdfJs = async () => {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.js';
  }
  return pdfjsLib;
};

interface PDFViewerProps {
  pdfUrl?: string;
  pdfFile?: File;
  className?: string;
}

export default function PDFViewer({ pdfUrl, pdfFile, className = '' }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.2);

  // Load PDF from URL or File
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfUrl && !pdfFile) {
        setPdf(null);
        setTotalPages(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Initialize PDF.js first
        const pdfjs = await initializePdfJs();
        if (!pdfjs) {
          throw new Error('Failed to initialize PDF.js');
        }

        let pdfData;
        
        if (pdfFile) {
          // Load from File object
          const arrayBuffer = await pdfFile.arrayBuffer();
          pdfData = new Uint8Array(arrayBuffer);
        } else if (pdfUrl) {
          // Handle Supabase storage URLs and local paths
          let resolvedUrl = pdfUrl;
          
          if (pdfUrl.startsWith('documents/')) {
            // Try signed URL first (works with private buckets)
            try {
              resolvedUrl = await getSupabaseSignedUrl(pdfUrl);
              console.log('🔄 Converted storage path to signed URL:', resolvedUrl);
            } catch (signedError) {
              console.log('⚠️ Signed URL failed, trying public URL...', signedError);
              // Fallback to public URL
              resolvedUrl = await getSupabasePublicUrl(pdfUrl);
              console.log('🔄 Converted storage path to public URL:', resolvedUrl);
            }
          }
          
          pdfData = resolvedUrl;
        }

        console.log('📄 Loading PDF with PDF.js...');
        const loadedPdf = await pdfjs.getDocument(pdfData).promise;
        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setCurrentPage(1);
        
        console.log(`✅ PDF loaded successfully: ${loadedPdf.numPages} pages`);
      } catch (err) {
        console.error('❌ PDF loading failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl, pdfFile]);

  // Convert Supabase storage path to signed URL
  const getSupabaseSignedUrl = async (filePath: string): Promise<string> => {
    try {
      const response = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      
      const result = await response.json();
      
      if (response.ok && result.signedUrl) {
        return result.signedUrl;
      } else {
        throw new Error(result.error || 'Failed to get signed URL');
      }
    } catch (error) {
      console.error('❌ Failed to get signed URL:', error);
      throw error; // Rethrow to allow fallback to public URL
    }
  };

  // Convert Supabase storage path to public URL (fallback)
  const getSupabasePublicUrl = async (filePath: string): Promise<string> => {
    try {
      const response = await fetch('/api/storage/public-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      
      const result = await response.json();
      
      if (response.ok && result.publicUrl) {
        return result.publicUrl;
      } else {
        throw new Error(result.error || 'Failed to get public URL');
      }
    } catch (error) {
      console.error('❌ Failed to get public URL:', error);
      return filePath; // Fallback to original path
    }
  };

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current || !pdfjsLib) return;

      try {
        console.log(`🎨 Rendering page ${currentPage}/${totalPages}`);
        
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        console.log(`✅ Page ${currentPage} rendered`);
        
      } catch (err) {
        console.error('❌ Page rendering failed:', err);
        setError('Failed to render PDF page');
      }
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.2);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📄</div>
          <div className="text-gray-600">Loading PDF...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 ${className}`}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="font-medium mb-2">PDF Loading Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📂</div>
          <div className="text-xl font-medium mb-2">No PDF Loaded</div>
          <div className="text-sm">Upload a PDF file to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-gray-100 ${className}`}>
      {/* PDF Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              ←
            </button>
            
            <span className="text-sm font-medium min-w-[80px] text-center">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Page"
            >
              →
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom Out"
            >
              −
            </button>
            
            <button
              onClick={resetZoom}
              className="px-3 py-1 text-sm rounded hover:bg-gray-100"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            
            <button
              onClick={zoomIn}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom In"
            >
              +
            </button>
          </div>
        </div>

        {/* PDF Info */}
        <div className="text-sm text-gray-600">
          Scale: {Math.round(scale * 100)}%
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 bg-gray-200 flex justify-center"
      >
        <div className="bg-white shadow-lg">
          <canvas 
            ref={canvasRef}
            className="max-w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
