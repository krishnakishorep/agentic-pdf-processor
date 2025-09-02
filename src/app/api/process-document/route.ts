import { NextRequest, NextResponse } from 'next/server';
import { documentDb, analysisDb } from '@/lib/database';
import { pdfProcessor } from '@/lib/pdf-processor';
import { emitDocumentEvent } from '@/lib/document-events';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    console.log(`📋 Processing document: ${documentId}`);

    // 1. Get document info from database
    const document = await documentDb.getById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 2. Update status to processing
    await documentDb.update(documentId, { status: 'processing' });
    
    // Emit processing started event
    emitDocumentEvent.processing(documentId, `Processing document: ${document.filename}`);

    try {
      // 3. Process the PDF (extract text + OpenAI analysis)
      const analysis = await pdfProcessor.processDocument(document.file_path, documentId);

      // 4. Save analysis results to database
      const analysisRecord = await analysisDb.create({
        document_id: documentId,
        document_type: analysis.documentType,
        page_count: analysis.pageCount,
        analysis_status: 'completed',
        confidence_score: analysis.confidence,
        metadata: {
          summary: analysis.summary,
          keyEntities: analysis.keyEntities,
          insights: analysis.insights,
          wordCount: analysis.wordCount,
          processedAt: new Date().toISOString()
        }
      });

      // 5. Update document status to completed
      await documentDb.update(documentId, { status: 'completed' });
      
      // Emit completion event
      emitDocumentEvent.completed(documentId, {
        type: analysis.documentType,
        confidence: analysis.confidence,
        summary: analysis.summary,
        insights: analysis.insights,
        filename: document.filename
      });

      console.log(`✅ Document processing complete: ${documentId}`);

      return NextResponse.json({
        success: true,
        analysis: {
          id: analysisRecord.id,
          documentType: analysis.documentType,
          confidence: analysis.confidence,
          summary: analysis.summary,
          keyEntities: analysis.keyEntities,
          insights: analysis.insights,
          pageCount: analysis.pageCount,
          wordCount: analysis.wordCount
        }
      });

    } catch (processingError) {
      console.error('❌ Document processing failed:', processingError);
      
      // Update document status to failed
      await documentDb.update(documentId, { status: 'failed' });
      
      // Emit failure event
      emitDocumentEvent.failed(documentId, processingError instanceof Error ? processingError.message : 'Unknown error');
      
      // Still save a failed analysis record for tracking
      await analysisDb.create({
        document_id: documentId,
        analysis_status: 'failed',
        metadata: {
          error: processingError instanceof Error ? processingError.message : 'Unknown error',
          failedAt: new Date().toISOString()
        }
      });

      return NextResponse.json(
        { 
          error: 'Document processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
