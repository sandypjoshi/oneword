-- DB Cleanup Script
-- Run this script manually in your Supabase SQL editor or preferred PostgreSQL client

-- Drop views first to avoid dependency issues
DROP VIEW IF EXISTS complete_word_view;

-- Create a consolidated view for word relationships to replace the individual relationship views
CREATE OR REPLACE VIEW word_relationships AS
SELECT 
    w1.word,
    w2.word AS related_word,
    r.relationship_type,
    s1.definition AS word_definition,
    s2.definition AS related_word_definition,
    s1.pos,
    s2.pos AS related_pos
FROM 
    word_synsets w1
    JOIN synsets s1 ON w1.synset_id = s1.id
    JOIN relationships r ON w1.synset_id = r.from_synset_id
    JOIN synsets s2 ON r.to_synset_id = s2.id
    JOIN word_synsets w2 ON w2.synset_id = r.to_synset_id
WHERE
    r.relationship_type IN ('synonym', 'antonym', 'hypernym', 'hyponym');

-- Drop the individual relationship views that have been replaced by the consolidated view
DROP VIEW IF EXISTS word_synonyms;
DROP VIEW IF EXISTS word_antonyms;
DROP VIEW IF EXISTS word_hypernyms;
DROP VIEW IF EXISTS word_hyponyms;

-- Drop trigger first
DROP TRIGGER IF EXISTS update_app_word_distractors_timestamp ON app_word_distractors;

-- Drop the function that supports the trigger
DROP FUNCTION IF EXISTS update_app_word_distractors_updated_at();

-- Drop empty tables (handling constraints)
ALTER TABLE IF EXISTS word_metadata DROP CONSTRAINT IF EXISTS word_metadata_word_fkey;
DROP TABLE IF EXISTS word_metadata;
DROP TABLE IF EXISTS app_word_distractors;

-- Drop word_normalization_map table (has 54,451 rows but seems redundant)
-- Note: This is a significant operation. Make sure you don't need this data before proceeding.
-- You might want to backup this table first: CREATE TABLE word_normalization_map_backup AS SELECT * FROM word_normalization_map;
DROP TABLE IF EXISTS word_normalization_map; 