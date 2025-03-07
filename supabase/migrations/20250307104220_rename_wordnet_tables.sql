-- Rename all tables by removing the "wordnet_" prefix
BEGIN;

-- 1. Rename tables (must be done before constraint updates)
ALTER TABLE IF EXISTS wordnet_words RENAME TO words;
ALTER TABLE IF EXISTS wordnet_synsets RENAME TO synsets;
ALTER TABLE IF EXISTS wordnet_word_synsets RENAME TO word_synsets;
ALTER TABLE IF EXISTS wordnet_relationships RENAME TO relationships;
ALTER TABLE IF EXISTS wordnet_distractors RENAME TO distractors;
ALTER TABLE IF EXISTS wordnet_daily_words RENAME TO daily_words;

-- 2. Rename indexes
ALTER INDEX IF EXISTS wordnet_words_word_idx RENAME TO words_word_idx;
ALTER INDEX IF EXISTS wordnet_words_lemma_idx RENAME TO words_lemma_idx;
ALTER INDEX IF EXISTS wordnet_words_difficulty_idx RENAME TO words_difficulty_idx;
ALTER INDEX IF EXISTS wordnet_words_word_pos_idx RENAME TO words_word_pos_idx;

ALTER INDEX IF EXISTS wordnet_synsets_lexical_domain_idx RENAME TO synsets_lexical_domain_idx;

ALTER INDEX IF EXISTS wordnet_word_synsets_word_idx RENAME TO word_synsets_word_idx;
ALTER INDEX IF EXISTS wordnet_word_synsets_synset_idx RENAME TO word_synsets_synset_idx;
ALTER INDEX IF EXISTS wordnet_word_synsets_word_synset_idx RENAME TO word_synsets_word_synset_idx;

ALTER INDEX IF EXISTS wordnet_relationships_source_idx RENAME TO relationships_source_idx;
ALTER INDEX IF EXISTS wordnet_relationships_target_idx RENAME TO relationships_target_idx;
ALTER INDEX IF EXISTS wordnet_relationships_type_idx RENAME TO relationships_type_idx;
ALTER INDEX IF EXISTS wordnet_relationships_source_target_type_idx RENAME TO relationships_source_target_type_idx;

ALTER INDEX IF EXISTS wordnet_distractors_word_idx RENAME TO distractors_word_idx;
ALTER INDEX IF EXISTS wordnet_distractors_quality_idx RENAME TO distractors_quality_idx;
ALTER INDEX IF EXISTS wordnet_distractors_word_distractor_idx RENAME TO distractors_word_distractor_idx;

ALTER INDEX IF EXISTS wordnet_daily_words_date_idx RENAME TO daily_words_date_idx;
ALTER INDEX IF EXISTS wordnet_daily_words_difficulty_idx RENAME TO daily_words_difficulty_idx;
ALTER INDEX IF EXISTS wordnet_daily_words_date_difficulty_idx RENAME TO daily_words_date_difficulty_idx;

-- 3. Update functions with renamed table references
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
    words w
  JOIN 
    word_synsets ws ON w.id = ws.word_id
  JOIN 
    synsets s ON ws.synset_id = s.id
  WHERE 
    w.difficulty_level = difficulty_param
  ORDER BY 
    RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

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
    distractors d
  WHERE 
    d.word_id = word_id_param
  ORDER BY 
    d.quality_score DESC, RANDOM()
  LIMIT count_param;
  
  -- Update usage count for the returned distractors
  UPDATE distractors
  SET usage_count = usage_count + 1
  WHERE id IN (
    SELECT id FROM get_distractors_for_word(word_id_param, count_param)
  );
END;
$$ LANGUAGE plpgsql;

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
  INSERT INTO daily_words (
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

COMMIT; 