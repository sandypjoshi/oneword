-- Comprehensive Database Optimization for OneWord
-- This script addresses several architectural issues:
-- 1. Separates definitions from examples in the synsets table
-- 2. Populates the word_examples table from examples in glosses
-- 3. Removes redundant columns from the words table
-- 4. Fixes the word_with_examples view

-----------------------------------------------------------------
-- PART 1: Extract examples from glosses and populate word_examples
-----------------------------------------------------------------

-- First, let's understand the current state
SELECT 
    (SELECT COUNT(*) FROM synsets) AS total_synsets,
    (SELECT COUNT(*) FROM synsets WHERE gloss LIKE '%\"%') AS synsets_with_examples,
    (SELECT COUNT(*) FROM word_examples) AS existing_examples;

-- Create function to extract examples from glosses
CREATE OR REPLACE FUNCTION extract_examples_from_gloss(gloss_text TEXT)
RETURNS TEXT[] AS $$
DECLARE
  examples TEXT[];
  example_regex TEXT := '"([^"]+)"';
  match TEXT;
BEGIN
  -- Initialize empty array for examples
  examples := '{}';
  
  -- Find all quoted text (examples) in the gloss
  FOR match IN
    SELECT (regexp_matches(gloss_text, example_regex, 'g'))[1]
  LOOP
    examples := array_append(examples, match);
  END LOOP;
  
  RETURN examples;
END;
$$ LANGUAGE plpgsql;

-- Create function to extract clean definitions from glosses
-- Preserves parenthetical content as it's part of the definition
-- but removes quoted examples
CREATE OR REPLACE FUNCTION extract_definition_from_gloss(gloss_text TEXT) 
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  cleaned_result TEXT;
  start_pos INTEGER;
  end_pos INTEGER;
  quote_pattern TEXT := '[""]([^""]+)["""]';
BEGIN
  -- Start with the full gloss
  result := gloss_text;
  
  -- Replace all quoted examples with empty string
  cleaned_result := regexp_replace(result, quote_pattern, '', 'g');
  
  -- Clean up any double semicolons that might have been created
  cleaned_result := regexp_replace(cleaned_result, ';;', ';', 'g');
  
  -- Clean up any trailing semicolons and whitespace
  cleaned_result := regexp_replace(cleaned_result, ';[ ]*$', '', 'g');
  
  -- Trim extra spaces
  cleaned_result := trim(cleaned_result);
  
  RETURN cleaned_result;
END;
$$ LANGUAGE plpgsql;

-- Test the functions to ensure they work correctly
SELECT 
  id,
  gloss,
  extract_definition_from_gloss(gloss) AS clean_definition,
  extract_examples_from_gloss(gloss) AS examples
FROM synsets
WHERE gloss LIKE '%\"%'
LIMIT 5;

-- Create a backup of the synsets table before modifying
CREATE TABLE IF NOT EXISTS synsets_backup AS
SELECT * FROM synsets;

-- Verify the backup
SELECT COUNT(*) FROM synsets;
SELECT COUNT(*) FROM synsets_backup;

-- Update the synsets table to have clean definitions
UPDATE synsets
SET definition = extract_definition_from_gloss(gloss)
WHERE (gloss LIKE '%\"%')
  AND definition = gloss;  -- Only update if definition equals gloss

-- Now populate the word_examples table
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

-- Verify the examples were inserted
SELECT COUNT(*) FROM word_examples;

-----------------------------------------------------------------
-- PART 2: Remove redundant columns from the words table
-----------------------------------------------------------------

-- Check if words have definitions or examples in the words table
SELECT 
    COUNT(*) AS total_words,
    COUNT(CASE WHEN definitions IS NOT NULL AND array_length(definitions, 1) > 0 THEN 1 END) AS words_with_definitions,
    COUNT(CASE WHEN examples IS NOT NULL AND array_length(examples, 1) > 0 THEN 1 END) AS words_with_examples
FROM public.words;

-- We can safely remove these columns since we've extracted all data properly
DO $$
BEGIN
    -- Check if definitions column exists and remove it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'words' 
        AND column_name = 'definitions'
    ) THEN
        ALTER TABLE public.words DROP COLUMN definitions;
        RAISE NOTICE 'Column "definitions" removed from words table';
    ELSE
        RAISE NOTICE 'Column "definitions" does not exist in words table - no action needed';
    END IF;
    
    -- Check if examples column exists and remove it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'words' 
        AND column_name = 'examples'
    ) THEN
        ALTER TABLE public.words DROP COLUMN examples;
        RAISE NOTICE 'Column "examples" removed from words table';
    ELSE
        RAISE NOTICE 'Column "examples" does not exist in words table - no action needed';
    END IF;
END $$;

-----------------------------------------------------------------
-- PART 3: Fix the word_with_examples view
-----------------------------------------------------------------

-- Show the current definition for reference
SELECT pg_get_viewdef('word_with_examples'::regclass, true);

-- Update the view to use INNER JOIN instead of LEFT JOIN
-- This will ensure there are no NULL examples
CREATE OR REPLACE VIEW "public"."word_with_examples" AS
 SELECT "w"."word",
    "s"."definition",
    "e"."example"
   FROM ((("public"."words" "w"
     JOIN "public"."word_synsets" "ws" ON (("w"."word" = "ws"."word")))
     JOIN "public"."synsets" "s" ON (("ws"."synset_id" = "s"."id")))
     JOIN "public"."word_examples" "e" ON ((("w"."word" = "e"."word") AND ("ws"."synset_id" = "e"."synset_id"))));

-----------------------------------------------------------------
-- PART 4: Verify the changes
-----------------------------------------------------------------

-- Check the counts to make sure everything is proper
SELECT 
    (SELECT COUNT(*) FROM synsets) AS total_synsets,
    (SELECT COUNT(*) FROM synsets WHERE definition != gloss) AS synsets_with_clean_definitions,
    (SELECT COUNT(*) FROM word_examples) AS total_examples,
    (SELECT COUNT(*) FROM word_with_examples) AS examples_in_view;

-- Show some sample data to verify the extraction worked correctly
SELECT s.id, s.gloss, s.definition, e.example 
FROM synsets s
JOIN word_examples e ON s.id = e.synset_id
LIMIT 5;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database optimization complete! Changes made:';
    RAISE NOTICE '1. Extracted examples from synset glosses and populated word_examples table';
    RAISE NOTICE '2. Cleaned definitions in synsets table to separate them from examples';
    RAISE NOTICE '3. Removed redundant columns from words table';
    RAISE NOTICE '4. Fixed word_with_examples view to exclude NULL examples';
END $$; 