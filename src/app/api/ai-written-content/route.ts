import { NextRequest, NextResponse } from 'next/server';
import { aiWrittenContentDb } from '@/lib/database';

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

function getActionEmoji(action: string): string {
  switch (action) {
    case 'continue':
      return '✨';
    case 'improve':
      return '📝';
    case 'expand':
      return '🔄';
    case 'rewrite':
      return '🎨';
    case 'generate':
      return '🚀';
    default:
      return '💡';
  }
}

function getActionDisplay(action: string): string {
  switch (action) {
    case 'continue':
      return 'continued';
    case 'improve':
      return 'improved';
    case 'expand':
      return 'expanded';
    case 'rewrite':
      return 'rewritten';
    case 'generate':
      return 'generated';
    default:
      return action;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get limit from query params (default 10)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get recent AI written content from the database
    const aiContent = await aiWrittenContentDb.getRecent(limit);

    // Transform to match RecentActivity expected format
    const transformedContent = aiContent.map(item => ({
      id: item.id,
      filename: item.title,
      status: 'completed',
      document_type: `AI ${getActionDisplay(item.action)}`,
      display_status: `AI-generated content (${item.action})`,
      time_ago: formatTimeAgo(item.created_at),
      action: item.action,
      emoji: getActionEmoji(item.action),
      preview: item.content.substring(0, 100) + '...',
      sources_count: (item.sources as string[])?.length || 0
    }));
    
    return NextResponse.json({
      success: true,
      documents: transformedContent,
      total: aiContent.length
    });
    
  } catch (error) {
    console.error('Error fetching AI written content:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch AI written content',
      documents: []
    }, { status: 500 });
  }
}

// Get specific AI written content by ID
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const content = await aiWrittenContentDb.getById(id);

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      content: {
        id: content.id,
        title: content.title,
        content: content.content,
        action: content.action,
        sources: content.sources || [],
        user_input: content.user_input,
        created_at: content.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching AI written content by ID:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch content'
    }, { status: 500 });
  }
}
