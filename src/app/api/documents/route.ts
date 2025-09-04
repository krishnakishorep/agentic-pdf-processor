import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  
  return date.toLocaleDateString();
}

function getDisplayStatus(status: string): string {
  switch (status) {
    case 'uploaded':
      return 'Ready to process';
    case 'processing':
      return 'Processing document...';
    case 'completed':
      return 'Processing complete';
    case 'failed':
      return 'Processing failed';
    default:
      return status;
  }
}

function getDocumentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'PDF Document';
    case 'doc':
    case 'docx':
      return 'Word Document';
    case 'txt':
      return 'Text File';
    default:
      return 'Document';
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get recent documents from the database
    const { data: documentsData, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Transform documents to match the expected format
    const documents = (documentsData || []).map(doc => ({
      id: doc.id,
      filename: doc.filename,
      status: doc.status,
      document_type: getDocumentType(doc.filename),
      display_status: getDisplayStatus(doc.status),
      time_ago: formatTimeAgo(doc.created_at)
    }));
    
    return NextResponse.json({
      success: true,
      documents
    });
    
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch documents',
      documents: []
    }, { status: 500 });
  }
}
