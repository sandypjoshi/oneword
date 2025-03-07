-- Create extension for generating UUIDs if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- Table: wordnet_words
-- Stores the words from WordNet
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wordnet_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  lemma TEXT NOT NULL,
  part_of_speech TEXT NOT NULL CHECK (part_of_speech IN ('noun', 'verb', 'adjective', 'adverb')),
  
  -- Difficulty scoring
  syllable_count INTEGER,
  polysemy_count INTEGER, -- Number of different meanings
  hierarchy_depth INTEGER, -- How deep in the hypernym hierarchy
  frequency_score DECIMAL(10, 6), -- 0.0 to 1.0 (1.0 being most frequent)
  difficulty_score DECIMAL(10, 6), -- 0.0 to 1.0 (1.0 being most difficult)
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT wordnet_words_word_pos_idx UNIQUE (word, part_of_speech)
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS wordnet_words_word_idx ON wordnet_words (word);
CREATE INDEX IF NOT EXISTS wordnet_words_lemma_idx ON wordnet_words (lemma);
CREATE INDEX IF NOT EXISTS wordnet_words_difficulty_idx ON wordnet_words (difficulty_level);

-- -----------------------------------------------------
-- Table: wordnet_synsets
-- Stores synsets (groups of synonymous words) from WordNet
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wordnet_synsets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  synset_id TEXT NOT NULL UNIQUE, -- Original WordNet synset ID
  definition TEXT NOT NULL,
  example TEXT,
  lexical_domain TEXT, -- The domain this synset belongs to
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster synset lookups
CREATE INDEX IF NOT EXISTS wordnet_synsets_lexical_domain_idx ON wordnet_synsets (lexical_domain);

-- -----------------------------------------------------
-- Table: wordnet_word_synsets
-- Maps words to synsets (many-to-many relationship)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wordnet_word_synsets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id UUID NOT NULL REFERENCES wordnet_words(id) ON DELETE CASCADE,
  synset_id UUID NOT NULL REFERENCES wordnet_synsets(id) ON DELETE CASCADE,
  sense_number INTEGER NOT NULL, -- The sense number of this word in this synset
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT wordnet_word_synsets_word_synset_idx UNIQUE (word_id, synset_id)
);

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS wordnet_word_synsets_word_idx ON wordnet_word_synsets (word_id);
CREATE INDEX IF NOT EXISTS wordnet_word_synsets_synset_idx ON wordnet_word_synsets (synset_id);

-- -----------------------------------------------------
-- Table: wordnet_relationships
-- Stores semantic relationships between synsets
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wordnet_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_synset_id UUID NOT NULL REFERENCES wordnet_synsets(id) ON DELETE CASCADE,
  target_synset_id UUID NOT NULL REFERENCES wordnet_synsets(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- e.g., hypernym, hyponym, meronym, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT wordnet_relationships_source_target_type_idx UNIQUE (source_synset_id, target_synset_id, relationship_type)
);

-- Create indexes for faster traversal of relationships
CREATE INDEX IF NOT EXISTS wordnet_relationships_source_idx ON wordnet_relationships (source_synset_id);
CREATE INDEX IF NOT EXISTS wordnet_relationships_target_idx ON wordnet_relationships (target_synset_id);
CREATE INDEX IF NOT EXISTS wordnet_relationships_type_idx ON wordnet_relationships (relationship_type);

-- -----------------------------------------------------
-- Table: wordnet_distractors
-- Stores pre-computed quality distractors for word quizzes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wordnet_distractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id UUID NOT NULL REFERENCES wordnet_words(id) ON DELETE CASCADE,
  synset_id UUID NOT NULL REFERENCES wordnet_synsets(id) ON DELETE CASCADE,
  distractor_text TEXT NOT NULL, -- The incorrect definition
  generation_method TEXT NOT NULL, -- How this distractor was generated
  quality_score DECIMAL(5,4) NOT NULL, -- 0.0 to 1.0 (1.0 being highest quality)
  usage_count INTEGER DEFAULT 0, -- Track how often this distractor has been used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT wordnet_distractors_word_distractor_idx UNIQUE (word_id, distractor_text)
);

-- Create index for faster distractor lookups
CREATE INDEX IF NOT EXISTS wordnet_distractors_word_idx ON wordnet_distractors (word_id);
CREATE INDEX IF NOT EXISTS wordnet_distractors_quality_idx ON wordnet_distractors (quality_score DESC);

-- -----------------------------------------------------
-- Table: wordnet_daily_words
-- Maps words to specific dates for "word of the day"
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wordnet_daily_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id UUID NOT NULL REFERENCES wordnet_words(id) ON DELETE CASCADE,
  synset_id UUID NOT NULL REFERENCES wordnet_synsets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  distractor_ids UUID[] NOT NULL, -- Array of distractor IDs for the quiz
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a unique constraint to ensure one word per date per difficulty
  CONSTRAINT wordnet_daily_words_date_difficulty_idx UNIQUE (date, difficulty)
);

-- Create indexes for faster date-based lookups
CREATE INDEX IF NOT EXISTS wordnet_daily_words_date_idx ON wordnet_daily_words (date);
CREATE INDEX IF NOT EXISTS wordnet_daily_words_difficulty_idx ON wordnet_daily_words (difficulty);

-- -----------------------------------------------------
-- Function to get a random word with a specific difficulty level
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_random_word_by_difficulty(
  difficulty_param TEXT
) RETURNS TABLE (
  id UUID,
  word TEXT,
  part_of_speech TEXT,
  difficulty_level TEXT,
  synset_id UUID,
  definition TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id, 
    w.word, 
    w.part_of_speech, 
    w.difficulty_level,
    s.id as synset_id,
    s.definition
  FROM 
    wordnet_words w
  JOIN 
    wordnet_word_synsets ws ON w.id = ws.word_id
  JOIN 
    wordnet_synsets s ON ws.synset_id = s.id
  WHERE 
    w.difficulty_level = difficulty_param
  ORDER BY 
    RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function to get distractors for a word
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_distractors_for_word(
  word_id_param UUID,
  count_param INTEGER DEFAULT 3
) RETURNS TABLE (
  id UUID,
  distractor_text TEXT,
  quality_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.distractor_text, 
    d.quality_score
  FROM 
    wordnet_distractors d
  WHERE 
    d.word_id = word_id_param
  ORDER BY 
    d.quality_score DESC, RANDOM()
  LIMIT count_param;
  
  -- Update usage count for the returned distractors
  UPDATE wordnet_distractors
  SET usage_count = usage_count + 1
  WHERE id IN (
    SELECT id FROM get_distractors_for_word(word_id_param, count_param)
  );
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function to seed a word for a specific date
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION seed_word_for_date(
  date_param DATE,
  difficulty_param TEXT
) RETURNS UUID AS $$
DECLARE
  word_record RECORD;
  distractor_ids UUID[] := '{}';
  daily_word_id UUID;
  distractor_record RECORD;
  distractor_count INTEGER := 3; -- Number of distractors to generate
BEGIN
  -- Get a random word with the specified difficulty
  SELECT * INTO word_record FROM get_random_word_by_difficulty(difficulty_param);
  
  -- Get distractors for the word
  FOR distractor_record IN 
    SELECT * FROM get_distractors_for_word(word_record.id, distractor_count)
  LOOP
    distractor_ids := distractor_ids || distractor_record.id;
  END LOOP;
  
  -- Create the daily word entry
  INSERT INTO wordnet_daily_words (
    word_id,
    synset_id,
    date,
    difficulty,
    distractor_ids
  ) VALUES (
    word_record.id,
    word_record.synset_id,
    date_param,
    difficulty_param,
    distractor_ids
  ) RETURNING id INTO daily_word_id;
  
  RETURN daily_word_id;
END;
$$ LANGUAGE plpgsql; 