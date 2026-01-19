-- Add AI accessibility and embedding to documents table
-- For Forge RAG integration

-- Add AI accessible flag (default: false - documents must opt-in)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_accessible BOOLEAN DEFAULT FALSE;

-- Add embedding column for vector search (768 dimensions for nomic-embed-text)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create IVFFlat index for fast approximate nearest neighbor search
-- Using cosine similarity for semantic search
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for quick filtering of AI-accessible documents
CREATE INDEX IF NOT EXISTS idx_documents_ai_accessible ON documents(ai_accessible) 
  WHERE ai_accessible = TRUE;

-- Comment for documentation
COMMENT ON COLUMN documents.ai_accessible IS 'When TRUE, Forge AI can read this document for RAG context';
COMMENT ON COLUMN documents.embedding IS '768-dim vector embedding from nomic-embed-text for semantic search';
