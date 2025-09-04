-- Fix: Update vector search function to match Langchain expectations
-- Corrected parameter order to avoid SQL error

-- Drop the existing function (if it exists)
DROP FUNCTION IF EXISTS public.match_documents_embeddings;

-- Create the function with Langchain's expected parameter signature
-- We'll match the exact order Langchain expects: filter, match_count, query_embedding
CREATE OR REPLACE FUNCTION match_documents_embeddings(
  filter jsonb,
  match_count int,
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
