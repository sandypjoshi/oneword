-- Script to clean the definition column in synsets by removing examples
-- In WordNet, the definition often includes examples in quotes
-- This script will strip those examples and keep only the pure definition

-- Create a function to extract just the definition part from a gloss
CREATE OR REPLACE FUNCTION extract_definition_from_gloss(gloss_text TEXT) 
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  semicolon_pos INTEGER;
  quote_pos INTEGER;
BEGIN
  -- Start with the full gloss
  result := gloss_text;
  
  -- Find the first quote which usually indicates the start of examples
  quote_pos := position('"' in result);
  
  -- If there's a quote, we need to clean up the definition
  IF quote_pos > 0 THEN
    -- Find the last semicolon before the first quote
    semicolon_pos := position(';' in substring(result from 1 for quote_pos));
    
    -- If we found a semicolon, take everything before it
    IF semicolon_pos > 0 THEN
      result := trim(substring(result from 1 for semicolon_pos - 1));
    ELSE
      -- If no semicolon, there might be quotes without semicolons
      -- In this case, take everything before the first quote
      result := trim(substring(result from 1 for quote_pos - 1));
    END IF;
  END IF;
  
  -- Handle the case where there's a semicolon but no quotes
  IF result = gloss_text THEN
    semicolon_pos := position(';' in result);
    IF semicolon_pos > 0 THEN
      -- In this case, take the first part as the definition
      result := trim(substring(result from 1 for semicolon_pos - 1));
    END IF;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test the function to ensure it works correctly
SELECT 
  id,
  gloss,
  definition, -- Current definition (same as gloss)
  extract_definition_from_gloss(gloss) AS clean_definition
FROM synsets
WHERE gloss LIKE '%\"%' OR gloss LIKE '%;%'
LIMIT 10;

-- Create a backup of the synsets table before updating
CREATE TABLE IF NOT EXISTS synsets_backup AS
SELECT * FROM synsets;

-- Verify the backup
SELECT COUNT(*) FROM synsets;
SELECT COUNT(*) FROM synsets_backup;

-- Update the definition column to contain only the pure definition
-- WARNING: This will modify your data. Make sure you have a backup.
UPDATE synsets
SET definition = extract_definition_from_gloss(gloss)
WHERE (gloss LIKE '%\"%' OR gloss LIKE '%;%')
  AND definition = gloss;  -- Only update if definition equals gloss

-- Verify the changes
SELECT 
  id,
  gloss,
  definition,
  extract_examples_from_gloss(gloss) AS examples
FROM synsets
WHERE (gloss LIKE '%\"%' OR gloss LIKE '%;%')
LIMIT 10;

-- Count how many rows were affected
SELECT COUNT(*) FROM synsets WHERE definition != gloss; 