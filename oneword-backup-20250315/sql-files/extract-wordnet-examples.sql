-- Script to extract WordNet examples from glosses and populate the word_examples table
-- In WordNet, the gloss field contains both the definition and examples
-- Examples are typically in quotes and separated by semicolons from the definition

-- First check the current state
SELECT COUNT(*) FROM word_examples;
SELECT COUNT(*) FROM synsets WHERE gloss LIKE '%\"%';

-- Create a function to parse examples from glosses
CREATE OR REPLACE FUNCTION extract_examples_from_gloss(gloss_text TEXT)
RETURNS TEXT[] AS $$
DECLARE
  examples TEXT[];
  example_regex TEXT := '"([^"]+)"';
  match TEXT;
  pos INT;
BEGIN
  -- Initialize empty array for examples
  examples := '{}';
  
  -- Find positions of all quoted text (examples) in the gloss
  FOR match IN
    SELECT (regexp_matches(gloss_text, example_regex, 'g'))[1]
  LOOP
    examples := array_append(examples, match);
  END LOOP;
  
  RETURN examples;
END;
$$ LANGUAGE plpgsql;

-- Test the function to ensure it works
SELECT 
  id, 
  gloss, 
  extract_examples_from_gloss(gloss) AS extracted_examples
FROM synsets
WHERE gloss LIKE '%\"%'
LIMIT 10;

-- Now populate the word_examples table with the extracted examples
-- First, clear any existing examples
TRUNCATE word_examples RESTART IDENTITY;

-- Insert examples extracted from synset glosses
INSERT INTO word_examples (word, synset_id, example, source)
SELECT 
  ws.word,
  s.id AS synset_id,
  example,
  'wordnet_gloss' AS source
FROM 
  synsets s
JOIN 
  word_synsets ws ON s.id = ws.synset_id
CROSS JOIN LATERAL
  unnest(extract_examples_from_gloss(s.gloss)) AS example
WHERE 
  s.gloss LIKE '%\"%';

-- Verify the data was inserted
SELECT COUNT(*) FROM word_examples;
SELECT word, synset_id, example FROM word_examples LIMIT 10; 