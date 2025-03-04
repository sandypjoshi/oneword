-- Drop existing tables if they exist (in reverse order of dependencies)
-- First drop constraints to handle dependencies
ALTER TABLE IF EXISTS user_progress DROP CONSTRAINT IF EXISTS user_progress_daily_word_id_fkey;

-- Now drop tables
DROP TABLE IF EXISTS word_relationships;
DROP TABLE IF EXISTS api_cache;
DROP TABLE IF EXISTS word_distractors;
DROP TABLE IF EXISTS daily_words CASCADE;
DROP TABLE IF EXISTS words;

-- Words table - comprehensive but focused
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL UNIQUE,
  pronunciation TEXT,
  part_of_speech TEXT,
  definitions JSONB[] NOT NULL,
  examples TEXT[],
  synonyms TEXT[],
  antonyms TEXT[],
  -- Meaningful metrics for word selection
  difficulty_score FLOAT DEFAULT 0.0,
  frequency_score FLOAT DEFAULT 0.0,
  syllable_count INTEGER,
  -- Quality indicators
  definition_count INTEGER GENERATED ALWAYS AS (array_length(definitions, 1)) STORED,
  has_examples BOOLEAN GENERATED ALWAYS AS (array_length(examples, 1) > 0) STORED,
  -- Flexible storage for API-specific data
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily words table - practical fields for quiz functionality
CREATE TABLE IF NOT EXISTS daily_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id UUID NOT NULL REFERENCES words(id),
  date DATE NOT NULL,
  difficulty TEXT NOT NULL,
  -- Quiz structure
  options JSONB[] NOT NULL,
  correct_option_index INTEGER NOT NULL,
  -- Optional enhancement fields
  hint TEXT,
  explanation TEXT,
  -- Basic analytics
  impression_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraints
  UNIQUE(date, difficulty)
);

-- Word distractors table - balanced quality and analytics
CREATE TABLE IF NOT EXISTS word_distractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  correct_definition JSONB NOT NULL,
  distractor TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  -- Source tracking
  source TEXT NOT NULL,
  source_word TEXT,
  -- Quality metrics
  semantic_similarity FLOAT DEFAULT 0.0,
  quality_score FLOAT DEFAULT 0.0,
  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  -- Content quality
  is_verified BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraints
  UNIQUE(word, distractor)
);

-- API cache table - practical caching with error tracking
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  api_name TEXT NOT NULL,
  endpoint TEXT DEFAULT '',
  params JSONB DEFAULT '{}'::jsonb,
  -- Response data
  response_data JSONB NOT NULL,
  response_status INTEGER,
  -- Cache management
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  hit_count INTEGER DEFAULT 1,
  -- Error tracking
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index for api_cache that handles NULL endpoints
CREATE UNIQUE INDEX idx_api_cache_unique ON api_cache(word, api_name, COALESCE(endpoint, ''));

-- Word relationships table - practical semantic connections
CREATE TABLE IF NOT EXISTS word_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_word TEXT NOT NULL,
  related_word TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  relationship_strength FLOAT DEFAULT 0.0,
  source TEXT NOT NULL,
  bidirectional BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_word, related_word, relationship_type)
);

-- Practical indices for query performance
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty_score, frequency_score);
CREATE INDEX IF NOT EXISTS idx_daily_words_date ON daily_words(date);
CREATE INDEX IF NOT EXISTS idx_daily_words_word_difficulty ON daily_words(word_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_word_distractors_word ON word_distractors(word);
CREATE INDEX IF NOT EXISTS idx_word_distractors_quality ON word_distractors(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_api_cache_expiry ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_word_relationships_source ON word_relationships(source_word);
CREATE INDEX IF NOT EXISTS idx_word_relationships_related ON word_relationships(related_word);

-- Timestamp update trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_words_modtime BEFORE UPDATE ON words FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_daily_words_modtime BEFORE UPDATE ON daily_words FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_word_distractors_modtime BEFORE UPDATE ON word_distractors FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_api_cache_modtime BEFORE UPDATE ON api_cache FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Usage counter increment function
CREATE OR REPLACE FUNCTION increment(table_name text, column_name text, row_id uuid, increment_by int DEFAULT 1)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', table_name, column_name, column_name)
  USING increment_by, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success rate calculation function
CREATE OR REPLACE FUNCTION update_success_count(table_name text, row_id uuid, was_successful boolean)
RETURNS void AS $$
BEGIN
  IF was_successful THEN
    EXECUTE format('UPDATE %I SET success_count = success_count + 1 WHERE id = $1', table_name)
    USING row_id;
  END IF;
  
  EXECUTE format('UPDATE %I SET impression_count = impression_count + 1 WHERE id = $1', table_name)
  USING row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_distractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_relationships ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY words_read_policy ON words FOR SELECT USING (true);
CREATE POLICY daily_words_read_policy ON daily_words FOR SELECT USING (true);

-- Authenticated user access for writes
CREATE POLICY words_insert_policy ON words FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY daily_words_insert_policy ON daily_words FOR INSERT TO authenticated WITH CHECK (true);

-- Service role policies for management tables
CREATE POLICY word_distractors_service_policy ON word_distractors USING (auth.role() = 'service_role');
CREATE POLICY api_cache_service_policy ON api_cache USING (auth.role() = 'service_role');
CREATE POLICY word_relationships_service_policy ON word_relationships USING (auth.role() = 'service_role');
