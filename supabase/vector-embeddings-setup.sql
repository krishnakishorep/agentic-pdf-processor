-- Vector Embeddings Setup for RAG
-- Run this in your Supabase SQL Editor after the main schema.sql

-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents_embeddings table for RAG vector storage
CREATE TABLE IF NOT EXISTS documents_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL, -- The chunk content
  metadata JSONB NOT NULL DEFAULT '{}', -- Source metadata (sourceId, sourceName, chunkIndex, etc.)
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small produces 1536-dimensional vectors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient vector similarity search
CREATE INDEX IF NOT EXISTS idx_documents_embeddings_embedding 
ON documents_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_documents_embeddings_metadata_source_id 
ON documents_embeddings USING GIN ((metadata->>'sourceId'));

-- Create index for content search
CREATE INDEX IF NOT EXISTS idx_documents_embeddings_content 
ON documents_embeddings USING GIN (to_tsvector('english', content));

-- Create similarity search function for Langchain
CREATE OR REPLACE FUNCTION match_documents_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM documents_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Create function to search by source ID
CREATE OR REPLACE FUNCTION get_documents_by_source(
  source_id text
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    created_at
  FROM documents_embeddings
  WHERE metadata->>'sourceId' = source_id
  ORDER BY (metadata->>'chunkIndex')::int;
$$;

-- Create function to delete by source ID
CREATE OR REPLACE FUNCTION delete_documents_by_source(
  source_id text
)
RETURNS int
LANGUAGE sql
AS $$
  DELETE FROM documents_embeddings
  WHERE metadata->>'sourceId' = source_id;
  
  SELECT ROW_COUNT();
$$;

-- Create vector store statistics view
CREATE OR REPLACE VIEW vector_store_stats AS
SELECT 
  COUNT(*) as total_chunks,
  COUNT(DISTINCT metadata->>'sourceId') as unique_sources,
  AVG(LENGTH(content)) as avg_chunk_length,
  MIN(created_at) as oldest_chunk,
  MAX(created_at) as newest_chunk,
  COUNT(*) FILTER (WHERE metadata->>'sourceType' = 'pdf') as pdf_chunks,
  COUNT(*) FILTER (WHERE metadata->>'sourceType' = 'url') as url_chunks,
  COUNT(*) FILTER (WHERE metadata->>'sourceType' = 'screenshot') as screenshot_chunks
FROM documents_embeddings;

-- Row Level Security for embeddings table
ALTER TABLE documents_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow public access (adjust for production security needs)
CREATE POLICY "Public read access" ON documents_embeddings FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON documents_embeddings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON documents_embeddings FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON documents_embeddings FOR DELETE USING (true);

-- Create trigger for automatic cleanup of old embeddings (optional)
CREATE OR REPLACE FUNCTION cleanup_old_embeddings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete embeddings older than 90 days for sources that no longer exist
  DELETE FROM documents_embeddings 
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND metadata->>'sourceId' NOT IN (
      SELECT DISTINCT metadata->>'sourceId' 
      FROM documents_embeddings 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    );
END;
$$;

-- Comments for documentation
COMMENT ON TABLE documents_embeddings IS 'Vector embeddings for RAG (Retrieval Augmented Generation)';
COMMENT ON COLUMN documents_embeddings.content IS 'Text chunk content for embedding';
COMMENT ON COLUMN documents_embeddings.metadata IS 'Source metadata: sourceId, sourceName, sourceType, chunkIndex, totalChunks, etc.';
COMMENT ON COLUMN documents_embeddings.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON FUNCTION match_documents_embeddings IS 'Vector similarity search function for Langchain RAG';

-- Create a sample query to test the setup
-- SELECT match_documents_embeddings(
--   '[0.1, 0.2, ...]'::vector, -- Your query embedding here
--   0.78, -- Similarity threshold
--   6     -- Number of results
-- );
