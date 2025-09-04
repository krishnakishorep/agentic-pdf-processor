import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug RAG search to understand why no documents are being retrieved
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const searchQuery = query || "microwave climate change";

    console.log(`🔍 Debugging RAG search for: "${searchQuery}"`);

    // Import necessary functions
    const { createClient } = await import('@supabase/supabase-js');
    const { OpenAIEmbeddings } = await import('@langchain/openai');

    // Initialize clients
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

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: 'text-embedding-3-small',
    });

    // Step 1: Check what documents exist
    console.log('1️⃣ Checking documents in vector store...');
    const { data: allDocs, error: countError } = await supabase
      .from('documents_embeddings')
      .select('id, content, metadata')
      .limit(5);

    if (countError) {
      throw new Error(`Error checking documents: ${countError.message}`);
    }

    console.log(`📊 Found ${allDocs?.length || 0} sample documents`);

    // Step 2: Generate embedding for search query
    console.log('2️⃣ Generating embedding for search query...');
    const queryEmbedding = await embeddings.embedQuery(searchQuery);
    console.log(`✅ Generated embedding with ${queryEmbedding.length} dimensions`);

    // Step 3: Test direct similarity search with different thresholds
    console.log('3️⃣ Testing similarity search with different thresholds...');

    const thresholds = [0.3, 0.5, 0.7, 0.8];
    const results = [];

    for (const threshold of thresholds) {
      const { data: similarDocs, error: searchError } = await supabase.rpc(
        'match_documents_embeddings',
        {
          filter: {},
          match_count: 5,
          query_embedding: queryEmbedding,
        }
      );

      if (searchError) {
        console.error(`Error with threshold ${threshold}:`, searchError);
        results.push({
          threshold,
          error: searchError.message,
          count: 0
        });
      } else {
        // Filter by threshold manually since our function uses 0.5
        const filtered = similarDocs?.filter((doc: any) => doc.similarity > threshold) || [];
        console.log(`Threshold ${threshold}: Found ${filtered.length} documents`);
        results.push({
          threshold,
          count: filtered.length,
          topResults: filtered.slice(0, 2).map((doc: any) => ({
            similarity: doc.similarity,
            content: doc.content.substring(0, 200) + '...',
            metadata: doc.metadata
          }))
        });
      }
    }

    // Step 4: Test with broader search terms
    console.log('4️⃣ Testing with broader search terms...');
    const broadQueries = [
      "climate change",
      "environmental science",
      "technology",
      "research"
    ];

    const broadResults = [];
    for (const broadQuery of broadQueries) {
      const broadEmbedding = await embeddings.embedQuery(broadQuery);
      const { data: broadDocs } = await supabase.rpc(
        'match_documents_embeddings',
        {
          filter: {},
          match_count: 3,
          query_embedding: broadEmbedding,
        }
      );

      const filtered = broadDocs?.filter((doc: any) => doc.similarity > 0.3) || [];
      broadResults.push({
        query: broadQuery,
        count: filtered.length,
        topResult: filtered[0] ? {
          similarity: filtered[0].similarity,
          content: filtered[0].content.substring(0, 150) + '...'
        } : null
      });
    }

    return NextResponse.json({
      success: true,
      searchQuery,
      debug: {
        totalDocumentsInStore: allDocs?.length || 0,
        sampleDocuments: allDocs?.slice(0, 2).map(doc => ({
          content: doc.content.substring(0, 100) + '...',
          metadata: doc.metadata
        })),
        embeddingDimensions: queryEmbedding.length,
        thresholdTests: results,
        broadSearchTests: broadResults
      }
    });

  } catch (error) {
    console.error('❌ Debug RAG failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
