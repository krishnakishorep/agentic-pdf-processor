-- Fix: Lower the similarity threshold to find more relevant documents
-- The current threshold of 0.5 is too strict

-- Drop and recreate the function with a lower threshold
DROP FUNCTION IF EXISTS public.match_documents_embeddings;

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
  WHERE 1 - (documents_embeddings.embedding <=> query_embedding) > 0.3
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
