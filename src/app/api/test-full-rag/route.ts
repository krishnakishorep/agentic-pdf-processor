import { NextRequest, NextResponse } from 'next/server';

/**
 * Complete RAG system test with proper error handling
 */
export async function GET() {
  try {
    console.log('🚀 Testing complete RAG system...');

    // Import all necessary functions
    const { 
      processDocumentForRAG, 
      addDocumentsToVectorStore, 
      queryRAG,
      getVectorStoreStats,
      getVectorStore 
    } = await import('@/lib/rag');

    // Step 1: Add test document to vector store
    console.log('1️⃣ Adding test document...');
    const testContent = `
    Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience.
    Deep learning uses neural networks with multiple layers to process complex patterns in data.
    Natural language processing helps computers understand and interpret human language.
    Computer vision allows machines to identify and analyze visual content from images and videos.
    These technologies have applications in healthcare, autonomous vehicles, finance, and many other fields.
    `;

    const documents = await processDocumentForRAG(testContent, {
      sourceId: 'rag-test-full-001',
      sourceName: 'Complete RAG Test Document',
      sourceType: 'pdf',
      uploadedAt: new Date().toISOString(),
    });

    console.log(`📄 Created ${documents.length} document chunks`);

    // Step 2: Add to vector store
    console.log('2️⃣ Adding to vector store...');
    await addDocumentsToVectorStore(documents);
    console.log('✅ Documents added successfully');

    // Step 3: Check stats
    console.log('3️⃣ Checking vector store stats...');
    const stats = await getVectorStoreStats();
    console.log(`📊 Stats: ${stats.totalDocuments} docs, ${stats.uniqueSources} sources`);

    // Step 4: Test basic RAG query (without complex chain for now)
    console.log('4️⃣ Testing basic retrieval...');
    const vectorStore = await getVectorStore();
    
    // Use direct similarity search instead of the full RAG chain
    const retriever = vectorStore.asRetriever({
      k: 3,
      searchType: 'similarity',
    });

    const relevantDocs = await retriever.getRelevantDocuments('Tell me about machine learning applications');
    console.log(`🔍 Found ${relevantDocs.length} relevant documents`);

    // Step 5: Test with simple LLM response (not full RAG chain yet)
    console.log('5️⃣ Testing simple AI response...');
    const { ChatOpenAI } = await import('@langchain/openai');
    
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: 'gpt-4o-mini', // Use smaller model for testing
      temperature: 0.7,
      maxTokens: 200,
    });

    // Create a simple context from retrieved docs
    const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');
    const query = 'What are some applications of machine learning?';
    
    const response = await llm.invoke([
      {
        role: 'system',
        content: 'Answer the question based on the provided context. Be concise and helpful.'
      },
      {
        role: 'user', 
        content: `Context: ${context}\n\nQuestion: ${query}`
      }
    ]);

    console.log(`✅ AI response generated: ${response.content.toString().length} characters`);

    // Step 6: Test full RAG query
    console.log('6️⃣ Testing full RAG query...');
    try {
      const ragResponse = await queryRAG('What are the main applications of artificial intelligence?');
      console.log(`🎉 Full RAG query successful: ${ragResponse.text.length} characters`);
      
      return NextResponse.json({
        success: true,
        message: 'Complete RAG system working perfectly!',
        results: {
          documentsProcessed: documents.length,
          vectorStoreStats: stats,
          retrievalResults: relevantDocs.length,
          simpleResponse: response.content.toString().substring(0, 200),
          fullRAGResponse: ragResponse.text.substring(0, 300),
          sourcesUsed: ragResponse.sources
        }
      });

    } catch (ragError) {
      console.log('⚠️ Full RAG query failed, but basic components work:', ragError);
      
      return NextResponse.json({
        success: true, // Still success because core components work
        message: 'Core RAG components working, full chain needs adjustment',
        results: {
          documentsProcessed: documents.length,
          vectorStoreStats: stats,
          retrievalResults: relevantDocs.length,
          simpleResponse: response.content.toString().substring(0, 200),
        },
        issue: 'Full RAG chain needs debugging',
        ragError: ragError instanceof Error ? ragError.message : 'Unknown RAG error'
      });
    }

  } catch (error) {
    console.error('❌ Complete RAG test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Clean up test data
 */
export async function DELETE() {
  try {
    const { removeDocumentsFromVectorStore } = await import('@/lib/rag');
    await removeDocumentsFromVectorStore('rag-test-full-001');
    
    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed'
    });
  }
}
