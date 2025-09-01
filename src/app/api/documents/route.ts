import { NextResponse } from 'next/server';
import { documentDb } from '@/lib/database';

// GET /api/documents - Get recent documents
export async function GET() {
  try {
    console.log('📋 Fetching recent documents...');

    const documents = await documentDb.getRecent(10);

    // Transform data for frontend
    const transformedDocs = documents.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      status: doc.status,
      document_type: doc.document_type || 'Unknown',
      display_status: doc.display_status || getDisplayStatus(doc.status),
      created_at: doc.created_at,
      // Calculate relative time
      time_ago: getTimeAgo(new Date(doc.created_at))
    }));

    return NextResponse.json({
      success: true,
      documents: transformedDocs
    });

  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get display-friendly status
function getDisplayStatus(status: string): string {
  switch (status) {
    case 'uploaded':
      return 'Uploaded';
    case 'processing':
      return 'Processing...';
    case 'completed':
      return 'Analysis complete';
    case 'failed':
      return 'Processing failed';
    default:
      return 'Unknown';
  }
}

// Helper function to get relative time
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}
