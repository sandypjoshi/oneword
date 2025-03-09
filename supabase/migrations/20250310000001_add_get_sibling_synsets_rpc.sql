-- Create a function to get sibling synsets for a word
-- These are words that share the same hypernym (parent concept)
CREATE OR REPLACE FUNCTION get_sibling_synsets(target_word TEXT, target_pos TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  word TEXT,
  definition TEXT,
  pos TEXT
) AS $$
DECLARE
BEGIN
  RETURN QUERY
  WITH target_synsets AS (
    -- Get synsets for the target word
    SELECT 
      s.id as synset_id,
      s.pos
    FROM 
      words w
      JOIN word_synsets ws ON w.id = ws.word_id
      JOIN synsets s ON ws.synset_id = s.id
    WHERE 
      w.word = target_word
      AND (target_pos IS NULL OR s.pos = target_pos)
  ),
  hypernyms AS (
    -- Get hypernyms (parent concepts) of these synsets
    SELECT 
      r.to_synset_id as hypernym_id
    FROM 
      target_synsets ts
      JOIN relationships r ON ts.synset_id = r.from_synset_id
    WHERE 
      r.relationship_type = 'hypernym'
  ),
  sibling_synsets AS (
    -- Get all synsets that share these hypernyms (siblings)
    SELECT DISTINCT
      s.id as synset_id,
      s.definition,
      s.pos
    FROM 
      hypernyms h
      JOIN relationships r ON h.hypernym_id = r.to_synset_id
      JOIN synsets s ON r.from_synset_id = s.id
    WHERE 
      r.relationship_type = 'hypernym'
      AND r.from_synset_id NOT IN (SELECT synset_id FROM target_synsets)
      AND (target_pos IS NULL OR s.pos = target_pos)
  )
  -- Get words associated with sibling synsets
  SELECT DISTINCT
    w.word,
    ss.definition,
    ss.pos
  FROM 
    sibling_synsets ss
    JOIN word_synsets ws ON ss.synset_id = ws.synset_id
    JOIN words w ON ws.word_id = w.id
  WHERE 
    w.word != target_word
  ORDER BY 
    RANDOM()
  LIMIT 
    limit_count;
END;
$$ LANGUAGE plpgsql;

-- Alternative function using a simpler approach for similar words by POS
CREATE OR REPLACE FUNCTION get_similar_words_by_pos(target_pos TEXT, exclude_word TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  word TEXT,
  definition TEXT,
  pos TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    w.word,
    s.definition,
    s.pos
  FROM 
    words w
    JOIN word_synsets ws ON w.id = ws.word_id
    JOIN synsets s ON ws.synset_id = s.id
  WHERE 
    s.pos = target_pos
    AND w.word != exclude_word
    AND w.definitions IS NOT NULL
    AND array_length(w.definitions, 1) > 0
  ORDER BY 
    RANDOM()
  LIMIT 
    limit_count;
END;
$$ LANGUAGE plpgsql; 