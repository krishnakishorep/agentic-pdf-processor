import { NextRequest, NextResponse } from 'next/server';

/**
 * Step-by-step RAG test to isolate issues
 */
export async function GET() {
  try {
    console.log('🔍 Step-by-step RAG test...');

    // Step 1: Test basic imports
    console.log('1️⃣ Testing imports...');
    const { processDocumentForRAG, addDocumentsToVectorStore } = await import('@/lib/rag');
    console.log('✅ Imports successful');

    // Step 2: Test document processing only
    console.log('2️⃣ Testing document processing...');
    const sampleContent = 'This is a test document about machine learning and artificial intelligence.';
    
    const documents = await processDocumentForRAG(sampleContent, {
      sourceId: 'test-simple-001',
      sourceName: 'Simple Test Document',
      sourceType: 'url',
      uploadedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Document processing: ${documents.length} chunks created`);

    // Step 3: Test vector store creation
    console.log('3️⃣ Testing vector store creation...');
    const { getVectorStore } = await import('@/lib/rag');
    const vectorStore = await getVectorStore();
    console.log('✅ Vector store created');

    // Step 4: Test embedding generation
    console.log('4️⃣ Testing embedding generation...');
    const { OpenAIEmbeddings } = await import('@langchain/openai');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: 'text-embedding-3-small',
    });
    
    const testEmbedding = await embeddings.embedQuery('test query');
    console.log(`✅ Embedding generation: ${testEmbedding.length} dimensions`);

    // Step 5: Test simple Supabase insert
    console.log('5️⃣ Testing direct Supabase insert...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Try a simple insert
    const { data: insertData, error: insertError } = await supabase
      .from('documents_embeddings')
      .insert([{
        content: sampleContent,
        metadata: {
          sourceId: 'test-simple-001',
          sourceName: 'Simple Test Document',
          sourceType: 'url',
          chunkIndex: 0,
          totalChunks: 1,
        },
        embedding: testEmbedding,
      }])
      .select();

    if (insertError) {
      console.error('Direct insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: `Direct insert failed: ${insertError.message}`,
        step: 'Direct Supabase insert'
      });
    }

    console.log('✅ Direct Supabase insert successful');

    // Step 6: Test simple query
    console.log('6️⃣ Testing simple query...');
    const { data: queryData, error: queryError } = await supabase
      .from('documents_embeddings')
      .select('*')
      .eq('metadata->>sourceId', 'test-simple-001')
      .limit(1);

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json({
        success: false,
        error: `Query failed: ${queryError.message}`,
        step: 'Simple query'
      });
    }

    console.log(`✅ Simple query: Found ${queryData?.length || 0} records`);

    // Clean up
    await supabase
      .from('documents_embeddings')
      .delete()
      .eq('metadata->>sourceId', 'test-simple-001');

    return NextResponse.json({
      success: true,
      message: 'All steps completed successfully',
      steps: {
        imports: '✅ Working',
        documentProcessing: `✅ ${documents.length} chunks`,
        vectorStore: '✅ Created',
        embeddings: `✅ ${testEmbedding.length} dimensions`,
        directInsert: '✅ Working',
        simpleQuery: `✅ Found ${queryData?.length || 0} records`
      }
    });

  } catch (error) {
    console.error('❌ Step-by-step test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
