-- AI Copilot Configuration Table
-- Stores Forge AI settings

CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'ollama',
  base_url VARCHAR(255) NOT NULL DEFAULT 'http://localhost:11434',
  model VARCHAR(100) NOT NULL DEFAULT 'llama3.1',
  strictness INTEGER NOT NULL DEFAULT 5 CHECK (strictness >= 1 AND strictness <= 10),
  context_window INTEGER NOT NULL DEFAULT 8192,
  embedding_model VARCHAR(100),
  batch_window_seconds INTEGER NOT NULL DEFAULT 30,
  persona_name VARCHAR(100) NOT NULL DEFAULT 'Forge',
  infrastructure_priority JSONB DEFAULT '{"power": true, "cooling": true, "access": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_config_updated ON ai_config(updated_at);

-- Insert default configuration if table is empty
INSERT INTO ai_config (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM ai_config);

-- Add comment for documentation
COMMENT ON TABLE ai_config IS 'Forge AI Copilot configuration settings';
