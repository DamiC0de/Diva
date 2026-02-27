-- 009: RPC function for semantic memory search (pgvector cosine similarity)

CREATE OR REPLACE FUNCTION match_memories(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  category memory_category,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT
    memories.id,
    memories.category,
    memories.content,
    1 - (memories.embedding <=> query_embedding) AS similarity,
    memories.created_at
  FROM memories
  WHERE memories.user_id = p_user_id
    AND memories.embedding IS NOT NULL
    AND 1 - (memories.embedding <=> query_embedding) > match_threshold
  ORDER BY memories.embedding <=> query_embedding
  LIMIT match_count;
$$;
