import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple RAG implementation that bypasses the complex chain
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const testQuery = query || "microwave climate research";

    console.log(`🔍 Simple RAG test for: "${testQuery}"`);

    // Step 1: Get relevant documents
    const { getVectorStore } = await import('@/lib/rag');
    const vectorStore = await getVectorStore();
    
    const retriever = vectorStore.asRetriever({
      k: 3,
      searchType: 'similarity',
    });

    const relevantDocs = await retriever.getRelevantDocuments(testQuery);
    console.log(`✅ Found ${relevantDocs.length} relevant documents`);

    if (relevantDocs.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No relevant documents found",
        query: testQuery
      });
    }

    // Step 2: Create context from retrieved documents
    const context = relevantDocs.map((doc, index) => 
      `Source ${index + 1} (${doc.metadata.sourceName}):\n${doc.pageContent}`
    ).join('\n\n');

    console.log(`📄 Created context: ${context.length} characters`);

    // Step 3: Use simple LLM call with context
    const { ChatOpenAI } = await import('@langchain/openai');
    
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1500,
    });

    const prompt = `Based on the following context, answer the user's question. Use information from the sources and cite them appropriately.

Context:
${context}

User Question: ${testQuery}

Please provide a comprehensive answer based on the context above:`;

    const response = await llm.invoke(prompt);
    const responseText = response.content.toString();

    console.log(`✅ Generated response: ${responseText.length} characters`);

    // Extract source names
    const sources = [...new Set(relevantDocs.map(doc => doc.metadata.sourceName))];

    return NextResponse.json({
      success: true,
      query: testQuery,
      response: responseText,
      sources,
      documentsUsed: relevantDocs.length,
      contextLength: context.length,
      sourceDetails: relevantDocs.map(doc => ({
        name: doc.metadata.sourceName,
        type: doc.metadata.sourceType,
        chunkIndex: doc.metadata.chunkIndex,
        content: doc.pageContent.substring(0, 150) + '...'
      }))
    });

  } catch (error) {
    console.error('❌ Simple RAG failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
