import { NextRequest, NextResponse } from 'next/server';
import { uploadPDF } from '@/lib/supabase';
import { documentDb } from '@/lib/database';
import { emitDocumentEvent } from '@/lib/document-events';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Processing PDF upload...');

    // Get the uploaded file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    console.log(`📁 Uploading: ${file.name} (${file.size} bytes)`);

    // 1. Upload file to Supabase Storage
    const uploadResult = await uploadPDF(file);

    // 2. Create document record in database
    const document = await documentDb.create({
      filename: uploadResult.originalName,
      file_path: uploadResult.path,
      file_size: uploadResult.size,
      mime_type: 'application/pdf',
      status: 'uploaded'
    });

    console.log(`✅ Document created with ID: ${document.id}`);

    // Emit SSE event for real-time UI updates
    emitDocumentEvent.uploaded(document.id, document.filename);

    // Automatically trigger document processing with delay to allow SSE connection
    try {
      // Small delay to ensure SSE connection is established before processing events
      setTimeout(() => {
        fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/process-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id })
        }).catch(error => {
          console.error('❌ Background processing failed:', error);
        });
      }, 1000); // 1 second delay for SSE connection to establish
      
      console.log(`🚀 Background processing will start in 1 second for document: ${document.id}`);
    } catch (error) {
      console.log('⚠️ Could not trigger background processing:', error);
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        status: document.status,
        created_at: document.created_at
      },
      message: 'File uploaded successfully - processing started'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
