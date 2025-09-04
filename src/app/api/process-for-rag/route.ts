import { NextRequest, NextResponse } from 'next/server';
import { 
  processDocumentForRAG, 
  addDocumentsToVectorStore, 
  getVectorStore,
  removeDocumentsFromVectorStore 
} from '@/lib/rag';

/**
 * Process sources and add them to the RAG vector store
 */
export async function POST(request: NextRequest) {
  try {
    const { sourceId, sourceName, sourceType, content } = await request.json();

    // Validate required fields
    if (!sourceId || !sourceName || !sourceType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceId, sourceName, sourceType, content' },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing source "${sourceName}" for RAG...`);

    // Remove any existing documents for this source (in case of reprocessing)
    try {
      await removeDocumentsFromVectorStore(sourceId);
    } catch (error) {
      console.log('⚠️ No existing documents to remove or removal failed:', error);
    }

    // Process the document into chunks
    const documents = await processDocumentForRAG(content, {
      sourceId,
      sourceName,
      sourceType,
      uploadedAt: new Date().toISOString(),
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'No content could be processed from this source' },
        { status: 400 }
      );
    }

    // Add documents to vector store
    await addDocumentsToVectorStore(documents);

    console.log(`✅ Successfully processed "${sourceName}" into ${documents.length} chunks for RAG`);

    return NextResponse.json({
      success: true,
      message: `Processed ${documents.length} chunks for RAG`,
      sourceId,
      chunks: documents.length,
      avgChunkSize: Math.round(documents.reduce((sum, doc) => sum + doc.pageContent.length, 0) / documents.length),
    });

  } catch (error) {
    console.error('❌ Error processing source for RAG:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process source for RAG',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Remove a source from the RAG vector store
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Missing sourceId parameter' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Removing source "${sourceId}" from RAG vector store...`);

    await removeDocumentsFromVectorStore(sourceId);

    console.log(`✅ Successfully removed source "${sourceId}" from RAG`);

    return NextResponse.json({
      success: true,
      message: `Removed source ${sourceId} from RAG vector store`,
      sourceId,
    });

  } catch (error) {
    console.error('❌ Error removing source from RAG:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove source from RAG',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get vector store statistics
 */
export async function GET() {
  try {
    const { getVectorStoreStats } = await import('@/lib/rag');
    const stats = await getVectorStoreStats();

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('❌ Error getting vector store stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get vector store stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
