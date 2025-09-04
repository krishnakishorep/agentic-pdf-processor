-- Fix: Update vector search function to match Langchain expectations
-- Run this in Supabase SQL Editor

-- Drop the existing function (if it exists)
DROP FUNCTION IF EXISTS public.match_documents_embeddings;

-- Create the function with the parameter signature that Langchain expects
CREATE OR REPLACE FUNCTION match_documents_embeddings(
  filter jsonb DEFAULT '{}',
  match_count int DEFAULT 6,
  query_embedding vector(1536)
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
    documents_embeddings.id,
    documents_embeddings.content,
    documents_embeddings.metadata,
    1 - (documents_embeddings.embedding <=> query_embedding) AS similarity
  FROM documents_embeddings
  WHERE 1 - (documents_embeddings.embedding <=> query_embedding) > 0.5
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Test the function (optional)
-- SELECT * FROM match_documents_embeddings('{}', 3, '[0.1,0.2,...]'::vector(1536));
