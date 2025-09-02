import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/documents - Get recent documents
export async function GET() {
  try {
    console.log('📋 Fetching recent documents...');

    // Get documents with analysis data
    const { data: documentsWithAnalysis, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_analysis (
          document_type,
          confidence_score,
          analysis_status,
          metadata
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Transform data for frontend
    const transformedDocs = (documentsWithAnalysis || []).map(doc => {
      const analysis = doc.document_analysis?.[0];
      
      return {
        id: doc.id,
        filename: doc.filename,
        status: doc.status,
        document_type: analysis?.document_type || 'Unknown',
        confidence: analysis?.confidence_score || null,
        display_status: getDisplayStatus(doc.status, analysis?.analysis_status),
        created_at: doc.created_at,
        time_ago: getTimeAgo(new Date(doc.created_at)),
        summary: analysis?.metadata?.summary || null,
        insights: analysis?.metadata?.insights || []
      };
    });

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
function getDisplayStatus(status: string, analysisStatus?: string): string {
  if (status === 'processing') {
    return 'Analyzing document...';
  }
  
  if (status === 'completed' && analysisStatus === 'completed') {
    return 'Analysis complete';
  }
  
  if (status === 'failed' || analysisStatus === 'failed') {
    return 'Analysis failed';
  }
  
  switch (status) {
    case 'uploaded':
      return 'Processing...';
    case 'completed':
      return 'Ready';
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
