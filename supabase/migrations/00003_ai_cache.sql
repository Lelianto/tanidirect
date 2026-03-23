-- Cache table untuk semua AI endpoints (Groq)
-- Mengurangi API calls berulang untuk input yang sama

CREATE TABLE ai_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,          -- 'matching', 'credit-score', dll
  cache_key TEXT NOT NULL,         -- preOrderId, petaniId, hash, dll
  response JSONB NOT NULL,         -- full JSON response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- kapan cache expired
  UNIQUE(endpoint, cache_key)
);

CREATE INDEX idx_ai_cache_lookup ON ai_cache(endpoint, cache_key, expires_at);
