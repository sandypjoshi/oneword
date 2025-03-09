-- Check if the table exists, create if it doesn't
CREATE TABLE IF NOT EXISTS word_distractors (
  id SERIAL PRIMARY KEY,
  word_id INTEGER REFERENCES words(id),
  distractor_definition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add source_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'word_distractors' AND column_name = 'source_type') THEN
    ALTER TABLE word_distractors ADD COLUMN source_type TEXT NOT NULL DEFAULT 'wordnet';
  END IF;

  -- Add quality_score column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'word_distractors' AND column_name = 'quality_score') THEN
    ALTER TABLE word_distractors ADD COLUMN quality_score FLOAT NOT NULL DEFAULT 0.5;
  END IF;

  -- Add semantic_distance column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'word_distractors' AND column_name = 'semantic_distance') THEN
    ALTER TABLE word_distractors ADD COLUMN semantic_distance FLOAT;
  END IF;

  -- Add distractor_word column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'word_distractors' AND column_name = 'distractor_word') THEN
    ALTER TABLE word_distractors ADD COLUMN distractor_word TEXT;
  END IF;

  -- Add selection_count (for tracking how often this distractor is chosen by users)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'word_distractors' AND column_name = 'selection_count') THEN
    ALTER TABLE word_distractors ADD COLUMN selection_count INTEGER DEFAULT 0;
  END IF;

  -- Add last_used timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'word_distractors' AND column_name = 'last_used') THEN
    ALTER TABLE word_distractors ADD COLUMN last_used TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_word_distractors_word_id ON word_distractors(word_id);
CREATE INDEX IF NOT EXISTS idx_word_distractors_quality ON word_distractors(quality_score DESC);

-- Create a view for easier access to word distractors with their target words
CREATE OR REPLACE VIEW word_distractors_view AS
SELECT 
  wd.id,
  wd.word_id,
  w.word as target_word,
  w.pos as target_pos,
  wd.distractor_word,
  wd.distractor_definition,
  wd.source_type,
  wd.quality_score,
  wd.semantic_distance,
  wd.selection_count,
  wd.last_used,
  wd.created_at
FROM word_distractors wd
JOIN words w ON wd.word_id = w.id;

-- Create a function to track distractor selection
CREATE OR REPLACE FUNCTION track_distractor_selection(distractor_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE word_distractors
  SET 
    selection_count = selection_count + 1,
    last_used = NOW()
  WHERE id = distractor_id;
END;
$$ LANGUAGE plpgsql; 