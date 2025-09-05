import { NextRequest, NextResponse } from 'next/server';
import { documentDb } from '@/lib/database';
import { emitDocumentEvent } from '@/lib/document-events';
import { supabase } from '@/lib/supabase';
import pdfParse from 'pdf-parse';
import { processDocumentForRAG, addDocumentsToVectorStore } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting document processing for: ${documentId}`);

    // Get document from database
    const document = await documentDb.getById(documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update status to processing
    await documentDb.update(documentId, { status: 'processing' });
    emitDocumentEvent.processing(documentId, `Processing "${document.filename}"...`);

    try {
      // Step 1: Download file from Supabase Storage
      console.log(`📥 Downloading file: ${document.file_path}`);
      const { data, error } = await supabase.storage
        .from('pdf-documents')
        .download(document.file_path);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      // Step 2: Extract text content
      console.log(`📄 Extracting text from PDF...`);
      emitDocumentEvent.processing(documentId, 'Extracting text from PDF...');
      
      const buffer = await data.arrayBuffer();
      const pdfData = await pdfParse(Buffer.from(buffer));
      const extractedText = pdfData.text;

      if (!extractedText || extractedText.length < 50) {
        throw new Error('Insufficient text content extracted from PDF');
      }

      console.log(`✅ Extracted ${extractedText.length} characters from PDF`);

      // Step 3: Process for RAG (add to vector store)
      console.log(`🧠 Processing for RAG...`);
      emitDocumentEvent.analyzing(documentId, 'Adding to AI knowledge base...');
      
      const ragDocuments = await processDocumentForRAG(extractedText, {
        sourceId: documentId,
        sourceName: document.filename,
        sourceType: 'pdf',
        uploadedAt: document.created_at,
      });

      await addDocumentsToVectorStore(ragDocuments);

      console.log(`✅ Processed ${ragDocuments.length} chunks for RAG`);

      // Step 4: Update document status to completed
      await documentDb.update(documentId, { 
        status: 'completed',
        updated_at: new Date().toISOString()
      });

      // Step 5: Emit completion event
      emitDocumentEvent.completed(documentId, {
        type: 'PDF Document',
        confidence: 1.0,
        textLength: extractedText.length,
        ragChunks: ragDocuments.length,
        filename: document.filename
      });

      console.log(`🎉 Document processing completed for: ${documentId}`);

      return NextResponse.json({
        success: true,
        documentId,
        textLength: extractedText.length,
        ragChunks: ragDocuments.length,
        status: 'completed'
      });

    } catch (processingError) {
      console.error(`❌ Processing failed for ${documentId}:`, processingError);
      
      // Update status to failed
      await documentDb.update(documentId, { status: 'failed' });
      
      // Emit failure event
      const errorMessage = processingError instanceof Error 
        ? processingError.message 
        : 'Processing failed';
      emitDocumentEvent.failed(documentId, errorMessage);

      return NextResponse.json({
        success: false,
        error: errorMessage,
        documentId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Document processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
