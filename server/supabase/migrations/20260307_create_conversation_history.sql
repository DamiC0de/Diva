-- Create conversation history table for persistent chat memory
CREATE TABLE IF NOT EXISTS conversation_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient user lookups
CREATE INDEX IF NOT EXISTS idx_conversation_history_user 
ON conversation_history(user_id, created_at DESC);

-- RLS policies
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own history
CREATE POLICY "Users can view own history" ON conversation_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all" ON conversation_history
  FOR ALL USING (auth.role() = 'service_role');
