-- DB Cleanup Script

-- 1. Drop triggers first
DROP TRIGGER IF EXISTS update_app_word_distractors_timestamp ON app_word_distractors;

-- 2. Drop functions that are no longer needed
DROP FUNCTION IF EXISTS update_app_word_distractors_updated_at();

-- 3. Drop views in the correct order to avoid dependency issues
-- First drop the complex complete_word_view that references multiple tables
DROP VIEW IF EXISTS complete_word_view;

-- 4. Create a consolidated word_relationships view to replace the individual relationship views
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

-- 5. Now drop the individual relationship views that are replaced by the consolidated view
DROP VIEW IF EXISTS word_synonyms;
DROP VIEW IF EXISTS word_antonyms;
DROP VIEW IF EXISTS word_hypernyms;
DROP VIEW IF EXISTS word_hyponyms;

-- 6. Drop tables in the correct order (handling foreign key constraints)
-- word_metadata has a foreign key to words.word
ALTER TABLE IF EXISTS word_metadata DROP CONSTRAINT IF EXISTS word_metadata_word_fkey;
DROP TABLE IF EXISTS word_metadata;

-- app_word_distractors has no constraints, so it can be dropped directly
DROP TABLE IF EXISTS app_word_distractors;

-- 7. Drop word_normalization_map if it's not being used by any functions/triggers/views
DROP TABLE IF EXISTS word_normalization_map;

-- 8. Add a comment explaining the cleanup
COMMENT ON DATABASE postgres IS 'Database cleaned up to remove unused tables, views, and functions'; 