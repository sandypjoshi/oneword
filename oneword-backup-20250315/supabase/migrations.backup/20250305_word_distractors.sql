-- ======================================================
-- Word Distractors Table Migration
-- ======================================================
-- This migration adds a table for storing quality distractors
-- for word definitions, which can be reused across quizzes
-- ======================================================

-- -----------------------------------------------------
-- Table: word_distractors
-- Stores quality distractors for word definitions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS word_distractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  part_of_speech TEXT,
  correct_definition TEXT NOT NULL,
  distractor TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  source TEXT NOT NULL, -- Where the distractor came from (e.g., 'template', 'synonym', 'related_word')
  quality_score FLOAT NOT NULL DEFAULT 0.8, -- Score to indicate the quality of the distractor
  usage_count INTEGER NOT NULL DEFAULT 0, -- Number of times this distractor has been used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure the combination of word and distractor is unique
  CONSTRAINT word_distractor_unique UNIQUE (word, distractor)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS word_distractors_word_idx ON word_distractors (word);
CREATE INDEX IF NOT EXISTS word_distractors_part_of_speech_idx ON word_distractors (part_of_speech);
CREATE INDEX IF NOT EXISTS word_distractors_difficulty_idx ON word_distractors (difficulty);
CREATE INDEX IF NOT EXISTS word_distractors_quality_score_idx ON word_distractors (quality_score DESC);
CREATE INDEX IF NOT EXISTS word_distractors_usage_count_idx ON word_distractors (usage_count);

-- Enable Row Level Security
ALTER TABLE IF EXISTS word_distractors ENABLE ROW LEVEL SECURITY;

-- Public can read word_distractors, but only service role can modify them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'word_distractors' 
    AND policyname = 'Allow public read access to word_distractors'
  ) THEN
    CREATE POLICY "Allow public read access to word_distractors"
      ON word_distractors
      FOR SELECT
      TO public
      USING (true);
  END IF;
END
$$;

-- Functions to help with distractor management

-- Function to check similarity between two text strings
DROP FUNCTION IF EXISTS text_similarity(TEXT, TEXT);
CREATE OR REPLACE FUNCTION text_similarity(text1 TEXT, text2 TEXT)
RETURNS FLOAT AS $$
DECLARE
  common_words INTEGER := 0;
  words1 TEXT[];
  words2 TEXT[];
  total_words INTEGER;
BEGIN
  -- Convert to lowercase and split into words
  words1 := regexp_split_to_array(lower(text1), '\W+');
  words2 := regexp_split_to_array(lower(text2), '\W+');
  
  -- Count words that appear in both texts (simple implementation)
  SELECT COUNT(*)
  FROM unnest(words1) AS w1
  WHERE w1 IN (SELECT unnest(words2)) AND length(w1) > 3
  INTO common_words;
  
  -- Get total number of unique words
  total_words := array_length(array_cat(words1, words2), 1);
  
  -- Return similarity score
  RETURN common_words::FLOAT / GREATEST(1, total_words::FLOAT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get distractors for a word
DROP FUNCTION IF EXISTS get_distractors_for_word(TEXT, TEXT, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION get_distractors_for_word(
  word_text TEXT,
  pos TEXT,
  difficulty TEXT,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  distractor TEXT,
  quality_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT wd.distractor, wd.quality_score
  FROM word_distractors wd
  WHERE wd.word = word_text
    AND (wd.part_of_speech = pos OR pos IS NULL)
    AND wd.difficulty = difficulty
  ORDER BY wd.quality_score DESC, wd.usage_count ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get general distractors by part of speech
DROP FUNCTION IF EXISTS get_general_distractors_by_pos(TEXT, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION get_general_distractors_by_pos(
  pos TEXT,
  difficulty TEXT,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  distractor TEXT,
  quality_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT wd.distractor, AVG(wd.quality_score) AS avg_quality_score
  FROM word_distractors wd
  WHERE wd.part_of_speech = pos
    AND wd.difficulty = difficulty
  GROUP BY wd.distractor
  ORDER BY avg_quality_score DESC, AVG(wd.usage_count) ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC function to increment a value by a given amount
DROP FUNCTION IF EXISTS increment(INTEGER);
CREATE OR REPLACE FUNCTION increment(val INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN val + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE; 