import { NextRequest, NextResponse } from 'next/server';
import { documentDb } from '@/lib/database';
import { downloadFile } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log(`🔍 Debugging file download for document: ${id}`);

    // Get document info
    const document = await documentDb.getById(id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`📄 Document info:`, {
      id: document.id,
      filename: document.filename,
      file_path: document.file_path,
      file_size: document.file_size,
      status: document.status
    });

    // Try to download the file
    try {
      const fileBuffer = await downloadFile(document.file_path);
      
      console.log(`📥 Download successful:`, {
        bufferSize: fileBuffer.size,
        expectedSize: document.file_size,
        type: fileBuffer.constructor.name
      });
      
      // Check if it's actually a PDF by looking at the header
      const uint8Array = new Uint8Array(fileBuffer);
      const header = Array.from(uint8Array.slice(0, 8))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');
      
      const headerString = String.fromCharCode(...uint8Array.slice(0, 8));
      
      console.log(`📋 File header analysis:`, {
        hexHeader: header,
        stringHeader: headerString,
        isPDFHeader: headerString.startsWith('%PDF'),
        firstBytes: Array.from(uint8Array.slice(0, 20))
      });

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          filename: document.filename,
          file_path: document.file_path,
          expected_size: document.file_size,
          actual_size: fileBuffer.size
        },
        fileAnalysis: {
          bufferType: fileBuffer.constructor.name,
          hexHeader: header,
          stringHeader: headerString,
          isPDFHeader: headerString.startsWith('%PDF'),
          sizesMatch: fileBuffer.size === document.file_size
        }
      });
      
    } catch (downloadError) {
      console.error('❌ Download failed:', downloadError);
      
      return NextResponse.json({
        success: false,
        error: 'File download failed',
        details: downloadError instanceof Error ? downloadError.message : 'Unknown download error',
        document: {
          id: document.id,
          filename: document.filename,
          file_path: document.file_path,
          file_size: document.file_size
        }
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
