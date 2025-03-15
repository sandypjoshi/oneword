-- Update word definitions in the words table by aggregating definitions from synsets
-- This script populates the definitions array in the words table using data from the synsets table

-- First, create a temporary view that aggregates definitions for each word
CREATE OR REPLACE FUNCTION update_word_definitions() 
RETURNS void AS $$
BEGIN
    -- Update words table with aggregated definitions from synsets
    UPDATE words w
    SET definitions = subquery.definitions_array
    FROM (
        SELECT 
            ws.word_id,
            array_agg(s.definition ORDER BY ws.sense_number) AS definitions_array
        FROM 
            word_synsets ws
            JOIN synsets s ON ws.synset_id = s.id
        GROUP BY 
            ws.word_id
    ) AS subquery
    WHERE 
        w.id = subquery.word_id
        AND (w.definitions IS NULL OR array_length(w.definitions, 1) IS NULL);

    -- Log how many records were updated
    RAISE NOTICE 'Updated definitions for % words', 
        (SELECT COUNT(*) FROM words WHERE definitions IS NOT NULL AND array_length(definitions, 1) > 0);
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT update_word_definitions();

-- Test a query to see some updated words with their definitions
SELECT word, definitions
FROM words
WHERE definitions IS NOT NULL
LIMIT 10; 