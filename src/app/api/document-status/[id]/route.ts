import { NextRequest, NextResponse } from 'next/server';
import { documentDb, analysisDb } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get document with analysis
    const document = await documentDb.getWithAnalysis(id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      id: document.id,
      filename: document.filename,
      status: document.status,
      created_at: document.created_at,
      analysis: document.analysis ? {
        documentType: document.analysis.document_type,
        confidence: document.analysis.confidence_score,
        pageCount: document.analysis.page_count,
        status: document.analysis.analysis_status,
        metadata: document.analysis.metadata
      } : null
    };

    return NextResponse.json({
      success: true,
      document: response
    });

  } catch (error) {
    console.error('❌ Error fetching document status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch document status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
