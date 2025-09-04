import { NextRequest, NextResponse } from 'next/server';
import { 
  getVectorStore, 
  processDocumentForRAG, 
  addDocumentsToVectorStore, 
  queryRAG,
  getVectorStoreStats 
} from '@/lib/rag';

/**
 * Test endpoint to verify RAG system is working
 */
export async function GET() {
  try {
    console.log('🧪 Testing RAG system...');

    // Test 1: Check vector store connection
    console.log('1️⃣ Testing vector store connection...');
    const vectorStore = await getVectorStore();
    console.log('✅ Vector store connected');

    // Test 2: Check database stats
    console.log('2️⃣ Checking vector store stats...');
    const stats = await getVectorStoreStats();
    console.log(`📊 Stats: ${stats.totalDocuments} docs, ${stats.uniqueSources} sources`);

    // Test 3: Add a sample document
    console.log('3️⃣ Testing document processing...');
    const sampleContent = `
    This is a test document about artificial intelligence and machine learning.
    It contains information about neural networks, deep learning algorithms, and their applications.
    The document discusses how AI can be used for natural language processing, computer vision, and data analysis.
    Machine learning models can learn from data and make predictions about future events.
    This technology has applications in healthcare, finance, autonomous vehicles, and many other fields.
    `;

    const documents = await processDocumentForRAG(sampleContent, {
      sourceId: 'test-doc-001',
      sourceName: 'RAG Test Document',
      sourceType: 'url',
      uploadedAt: new Date().toISOString(),
    });

    console.log(`📄 Created ${documents.length} chunks from test document`);

    // Test 4: Add to vector store
    console.log('4️⃣ Testing vector store insertion...');
    await addDocumentsToVectorStore(documents, vectorStore);
    console.log('✅ Documents added to vector store');

    // Test 5: Test RAG query
    console.log('5️⃣ Testing RAG query...');
    const ragResponse = await queryRAG('Tell me about machine learning applications');
    console.log(`💡 RAG query returned ${ragResponse.text.length} characters`);
    console.log(`📚 Used ${ragResponse.sourceDocuments?.length || 0} source chunks`);

    // Test 6: Updated stats
    const updatedStats = await getVectorStoreStats();
    console.log(`📊 Updated stats: ${updatedStats.totalDocuments} docs, ${updatedStats.uniqueSources} sources`);

    return NextResponse.json({
      success: true,
      message: 'RAG system test completed successfully',
      tests: {
        vectorStoreConnection: '✅ Connected',
        documentProcessing: `✅ Created ${documents.length} chunks`,
        vectorInsertion: '✅ Documents added',
        ragQuery: `✅ Query returned ${ragResponse.text.length} chars`,
        sourceRetrieval: `✅ Used ${ragResponse.sourceDocuments?.length || 0} chunks`
      },
      stats: {
        before: stats,
        after: updatedStats
      },
      sampleResponse: ragResponse.text.substring(0, 500) + '...'
    });

  } catch (error) {
    console.error('❌ RAG test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'RAG system test failed - check server logs for details'
    }, { status: 500 });
  }
}

/**
 * Clean up test data
 */
export async function DELETE() {
  try {
    console.log('🧹 Cleaning up test data...');
    
    const { removeDocumentsFromVectorStore } = await import('@/lib/rag');
    await removeDocumentsFromVectorStore('test-doc-001');
    
    console.log('✅ Test data cleaned up');
    
    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully'
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
