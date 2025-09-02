import { NextRequest, NextResponse } from 'next/server';
import { pdfProcessor } from '@/lib/pdf-processor';
import { documentDb } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();
    
    if (!documentId) {
      // Get the most recent document for testing
      const recentDocs = await documentDb.getRecent(1);
      if (recentDocs.length === 0) {
        return NextResponse.json(
          { error: 'No documents found. Please upload a PDF first.' },
          { status: 400 }
        );
      }
      
      const document = recentDocs[0];
      
      console.log(`🧪 Testing PDF processing with: ${document.filename}`);
      
      // Test the processing pipeline
      const analysis = await pdfProcessor.processDocument(document.file_path);
      
      return NextResponse.json({
        success: true,
        message: 'PDF processing test successful',
        document: {
          id: document.id,
          filename: document.filename
        },
        analysis: {
          documentType: analysis.documentType,
          confidence: analysis.confidence,
          summary: analysis.summary,
          keyEntities: analysis.keyEntities,
          insights: analysis.insights,
          pageCount: analysis.pageCount,
          wordCount: analysis.wordCount
        }
      });
    }
    
    // Test with specific document ID
    const document = await documentDb.getById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    console.log(`🧪 Testing PDF processing with: ${document.filename}`);
    
    const analysis = await pdfProcessor.processDocument(document.file_path);
    
    return NextResponse.json({
      success: true,
      message: 'PDF processing test successful',
      analysis
    });
    
  } catch (error) {
    console.error('❌ Processing test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Processing test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
