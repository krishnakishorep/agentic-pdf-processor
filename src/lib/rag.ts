import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

// Initialize Supabase client for vector operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Document processing configuration
const CHUNK_SIZE = 1000; // Optimal for most content
const CHUNK_OVERLAP = 200; // Good balance of context preservation
const SEPARATORS = [
  '\n\n', // Paragraphs
  '\n',   // Lines
  '. ',   // Sentences
  '! ',   // Exclamations
  '? ',   // Questions
  ';',    // Semicolons
  ',',    // Commas
  ' ',    // Words
  '',     // Characters
];

/**
 * Text splitter optimized for content writing RAG
 */
export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: SEPARATORS,
  keepSeparator: true, // Preserve formatting context
  lengthFunction: (text: string) => text.length,
});

/**
 * OpenAI embeddings configuration
 */
export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  modelName: 'text-embedding-3-small', // Good balance of performance/cost
  batchSize: 100, // Process multiple chunks efficiently
});

/**
 * Initialize Supabase Vector Store
 */
export async function getVectorStore(): Promise<SupabaseVectorStore> {
  try {
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents_embeddings', // We'll create this table
      queryName: 'match_documents_embeddings',
    });
    
    return vectorStore;
  } catch (error) {
    console.error('Error initializing vector store:', error);
    throw new Error('Failed to initialize vector store');
  }
}

/**
 * Process and chunk a document for RAG
 */
export async function processDocumentForRAG(
  content: string,
  metadata: {
    sourceId: string;
    sourceName: string;
    sourceType: 'pdf' | 'url' | 'screenshot';
    uploadedAt: string;
  }
): Promise<Document[]> {
  try {
    console.log(`🔄 Processing document "${metadata.sourceName}" for RAG...`);
    
    // Clean and validate content
    const cleanedContent = content.trim();
    if (cleanedContent.length < 50) {
      console.log('⚠️ Document too short for chunking, creating single chunk');
      return [
        new Document({
          pageContent: cleanedContent,
          metadata: {
            ...metadata,
            chunkId: `${metadata.sourceId}_chunk_0`,
            chunkIndex: 0,
            totalChunks: 1,
          },
        }),
      ];
    }

    // Split into chunks
    const chunks = await textSplitter.splitText(cleanedContent);
    console.log(`📄 Split into ${chunks.length} chunks (avg: ${Math.round(cleanedContent.length / chunks.length)} chars/chunk)`);

    // Create Document objects with enriched metadata
    const documents = chunks.map((chunk, index) => 
      new Document({
        pageContent: chunk,
        metadata: {
          ...metadata,
          chunkId: `${metadata.sourceId}_chunk_${index}`,
          chunkIndex: index,
          totalChunks: chunks.length,
          chunkSize: chunk.length,
        },
      })
    );

    console.log(`✅ Created ${documents.length} document chunks for RAG`);
    return documents;

  } catch (error) {
    console.error('Error processing document for RAG:', error);
    throw new Error(`Failed to process document "${metadata.sourceName}" for RAG`);
  }
}

/**
 * Add documents to the vector store
 */
export async function addDocumentsToVectorStore(
  documents: Document[],
  vectorStore?: SupabaseVectorStore
): Promise<void> {
  try {
    const store = vectorStore || await getVectorStore();
    
    console.log(`📝 Adding ${documents.length} chunks to vector store...`);
    
    // Batch process documents to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await store.addDocuments(batch);
      console.log(`✅ Added batch ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(documents.length / batchSize)}`);
      
      // Small delay to avoid overwhelming the API
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`🎉 Successfully added all ${documents.length} chunks to vector store`);
  } catch (error) {
    console.error('Error adding documents to vector store:', error);
    throw new Error('Failed to add documents to vector store');
  }
}


/**
 * Query the RAG system for content assistance
 * Using simple but reliable RAG implementation
 */
export async function queryRAG(
  question: string,
  vectorStore?: SupabaseVectorStore
): Promise<{
  text: string;
  sources: string[];
  sourceDocuments?: Document[];
}> {
  try {
    console.log(`🤔 RAG Query: "${question}"`);
    
    // Step 1: Get relevant documents using retriever
    const store = vectorStore || await getVectorStore();
    const retriever = store.asRetriever({
      k: 6, // Get top 6 most relevant chunks
      searchType: 'similarity',
    });

    const relevantDocs = await retriever.getRelevantDocuments(question);
    console.log(`✅ Found ${relevantDocs.length} relevant documents`);

    if (relevantDocs.length === 0) {
      console.log('⚠️ No relevant documents found, falling back');
      throw new Error('No relevant documents found');
    }

    // Step 2: Create context from retrieved documents
    const context = relevantDocs.map((doc, index) => 
      `Source ${index + 1} (${doc.metadata.sourceName}):\n${doc.pageContent}`
    ).join('\n\n---\n\n');

    console.log(`📄 Created context: ${context.length} characters from ${relevantDocs.length} sources`);

    // Step 3: Use LLM with structured prompt
    const { ChatOpenAI } = await import('@langchain/openai');
    
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
    });

    const prompt = `You are a helpful AI assistant. Use the provided context to answer the user's question comprehensively and accurately.

Context from sources:
${context}

User Question: ${question}

Instructions:
- Base your answer primarily on the provided context
- Be comprehensive and informative
- Maintain a natural writing style
- Reference information from the sources when relevant
- If the context doesn't fully address the question, supplement with your general knowledge while being clear about what comes from sources vs. general knowledge

Answer:`;

    const response = await llm.invoke(prompt);
    const text = response.content.toString();

    console.log(`💡 RAG Response generated: ${text.length} characters`);

    // Extract source names (remove duplicates)
    const sources = [...new Set(relevantDocs.map(doc => doc.metadata.sourceName))];
    
    console.log(`📚 Used sources: ${sources.join(', ')}`);

    return {
      text,
      sources,
      sourceDocuments: relevantDocs,
    };
  } catch (error) {
    console.error('Error querying RAG:', error);
    throw new Error('RAG query failed');
  }
}

/**
 * Remove documents from vector store by source ID
 */
export async function removeDocumentsFromVectorStore(
  sourceId: string,
  vectorStore?: SupabaseVectorStore
): Promise<void> {
  try {
    const store = vectorStore || await getVectorStore();
    
    console.log(`🗑️ Removing documents for source: ${sourceId}`);
    
    // Query for documents with this source ID
    const { data, error } = await supabase
      .from('documents_embeddings')
      .delete()
      .eq('metadata->sourceId', sourceId);

    if (error) {
      throw error;
    }

    console.log(`✅ Removed documents for source: ${sourceId}`);
  } catch (error) {
    console.error('Error removing documents from vector store:', error);
    throw new Error(`Failed to remove documents for source: ${sourceId}`);
  }
}

/**
 * Get document count in vector store
 */
export async function getVectorStoreStats(): Promise<{
  totalDocuments: number;
  uniqueSources: number;
}> {
  try {
    const { count: totalDocuments } = await supabase
      .from('documents_embeddings')
      .select('*', { count: 'exact', head: true });

    const { data: sourceIdsData } = await supabase
      .from('documents_embeddings')
      .select('metadata->sourceId');

    // Manually deduplicate sourceIds on client side
    const uniqueSourceIds = new Set(
      sourceIdsData?.map(item => item?.sourceId).filter(Boolean) || []
    );
    const uniqueSources = uniqueSourceIds.size;

    return {
      totalDocuments: totalDocuments || 0,
      uniqueSources,
    };
  } catch (error) {
    console.error('Error getting vector store stats:', error);
    return { totalDocuments: 0, uniqueSources: 0 };
  }
}
