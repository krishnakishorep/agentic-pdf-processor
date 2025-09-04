import { NextRequest, NextResponse } from 'next/server';

/**
 * Test the RAG chain directly to isolate the issue
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const testQuery = query || "microwave climate research";

    console.log(`🔍 Testing RAG chain directly with: "${testQuery}"`);

    // Step 1: Test vector store retrieval
    console.log('1️⃣ Testing vector store retrieval...');
    const { getVectorStore } = await import('@/lib/rag');
    
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever({
      k: 3,
      searchType: 'similarity',
    });

    const relevantDocs = await retriever.getRelevantDocuments(testQuery);
    console.log(`✅ Direct retrieval: Found ${relevantDocs.length} documents`);

    // Step 2: Test RAG chain creation
    console.log('2️⃣ Testing RAG chain creation...');
    const { createRAGChain } = await import('@/lib/rag');
    
    try {
      const chain = await createRAGChain(vectorStore);
      console.log('✅ RAG chain created successfully');

      // Step 3: Test RAG chain query
      console.log('3️⃣ Testing RAG chain query...');
      const response = await chain.call({
        query: testQuery,
      });

      console.log('RAG chain response object:', response);
      console.log('Response keys:', Object.keys(response || {}));
      
      const responseText = response?.text || response?.result || response?.output_text || '';
      const sourceDocuments = response?.sourceDocuments || [];
      
      console.log(`✅ RAG chain response: ${responseText.length} characters`);
      console.log(`📚 Source documents: ${sourceDocuments.length}`);

      return NextResponse.json({
        success: true,
        testQuery,
        results: {
          directRetrieval: {
            documentsFound: relevantDocs.length,
            sampleContent: relevantDocs[0]?.pageContent.substring(0, 200) || 'No content',
            metadata: relevantDocs[0]?.metadata || {}
          },
          ragChain: {
            responseLength: responseText.length,
            sourceDocumentsCount: sourceDocuments.length,
            response: responseText || 'No response',
            sources: sourceDocuments.map((doc: any) => doc.metadata?.sourceName || 'Unknown') || []
          }
        }
      });

    } catch (chainError) {
      console.error('❌ RAG chain error:', chainError);
      
      return NextResponse.json({
        success: false,
        error: `RAG chain failed: ${chainError instanceof Error ? chainError.message : 'Unknown error'}`,
        testQuery,
        directRetrievalWorked: relevantDocs.length > 0,
        directRetrievalSample: relevantDocs[0]?.pageContent.substring(0, 200) || 'No content'
      });
    }

  } catch (error) {
    console.error('❌ RAG chain test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
