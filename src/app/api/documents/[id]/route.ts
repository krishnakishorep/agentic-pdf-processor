import { NextRequest, NextResponse } from 'next/server';
import { documentDb, analysisDb } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    console.log(`📄 Fetching document: ${id}`);

    // Get document details
    const document = await documentDb.getById(id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get analysis data if available
    const analysisData = await analysisDb.getByDocumentId(id);
    
    // Combine document with analysis
    const documentWithAnalysis = {
      ...document,
      analysis: analysisData
    };

    console.log(`✅ Document fetched successfully: ${document.filename}`);

    return NextResponse.json({
      success: true,
      document: documentWithAnalysis
    });

  } catch (error) {
    console.error(`❌ Error fetching document:`, error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
