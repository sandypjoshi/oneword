-- Function to generate high-quality distractors for a specific word
CREATE OR REPLACE FUNCTION generate_wordnet_distractors(target_word_id INTEGER, distractor_count INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
    target_word_record RECORD;
    inserted_count INTEGER := 0;
    distractor_record RECORD;
BEGIN
    -- Get target word info
    SELECT id, word, pos, difficulty_level INTO target_word_record
    FROM words
    WHERE id = target_word_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Word with ID % not found', target_word_id;
    END IF;
    
    -- Clear existing low-quality distractors for this word to refresh them
    DELETE FROM word_distractors 
    WHERE word_id = target_word_id 
    AND (quality_score IS NULL OR quality_score < 0.6)
    AND creation_method = 'wordnet';
    
    -- 1. Generate distractors using words from the same synset (synonyms)
    INSERT INTO word_distractors (
        word_id, 
        distractor_definition, 
        quality_score,
        distractor_type,
        similarity_score,
        creation_method
    )
    SELECT DISTINCT
        target_word_id,
        s.definition,
        0.9, -- High quality score for related synsets
        'synonym',
        0.8,
        'wordnet'
    FROM word_synsets ws1
    JOIN word_synsets ws2 ON ws1.synset_id = ws2.synset_id AND ws1.word_id != ws2.word_id
    JOIN synsets s ON ws2.synset_id = s.id
    JOIN words w ON ws2.word_id = w.id
    WHERE ws1.word_id = target_word_id
    AND w.pos = target_word_record.pos
    AND NOT EXISTS (
        SELECT 1 FROM word_distractors 
        WHERE word_id = target_word_id 
        AND distractor_definition = s.definition
    )
    LIMIT distractor_count;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    -- 2. Generate distractors using words from related synsets (hypernyms, hyponyms)
    IF inserted_count < distractor_count THEN
        INSERT INTO word_distractors (
            word_id, 
            distractor_definition, 
            quality_score,
            distractor_type,
            similarity_score,
            creation_method
        )
        SELECT DISTINCT
            target_word_id,
            s.definition,
            0.8, -- Good quality score for related concepts
            CASE 
                WHEN r.relationship_type = 'hypernym' THEN 'hypernym'
                WHEN r.relationship_type = 'hyponym' THEN 'hyponym'
                ELSE r.relationship_type
            END,
            0.7,
            'wordnet'
        FROM word_synsets ws
        JOIN relationships r ON ws.synset_id = r.from_synset_id
        JOIN synsets s ON r.to_synset_id = s.id
        WHERE ws.word_id = target_word_id
        AND r.relationship_type IN ('hypernym', 'hyponym', 'similar')
        AND NOT EXISTS (
            SELECT 1 FROM word_distractors 
            WHERE word_id = target_word_id 
            AND distractor_definition = s.definition
        )
        LIMIT (distractor_count - inserted_count);
        
        GET DIAGNOSTICS inserted_count = inserted_count + ROW_COUNT;
    END IF;
    
    -- 3. Generate distractors using words with the same part of speech
    IF inserted_count < distractor_count THEN
        INSERT INTO word_distractors (
            word_id, 
            distractor_definition, 
            quality_score,
            distractor_type,
            similarity_score,
            creation_method
        )
        SELECT DISTINCT
            target_word_id,
            definitions[1],
            score_distractor(target_word_id, w.id), -- Use our scoring function
            'same_pos',
            0.5,
            'wordnet'
        FROM words w
        WHERE w.pos = target_word_record.pos
        AND w.id != target_word_id
        AND w.definitions IS NOT NULL
        AND array_length(w.definitions, 1) > 0
        AND w.difficulty_level = target_word_record.difficulty_level
        AND NOT EXISTS (
            SELECT 1 FROM word_distractors 
            WHERE word_id = target_word_id 
            AND distractor_definition = w.definitions[1]
        )
        ORDER BY RANDOM() -- Mix up the results for variety
        LIMIT (distractor_count - inserted_count);
        
        GET DIAGNOSTICS inserted_count = inserted_count + ROW_COUNT;
    END IF;
    
    -- 4. As a fallback, use words with opposite meanings (antonyms)
    IF inserted_count < distractor_count THEN
        INSERT INTO word_distractors (
            word_id, 
            distractor_definition, 
            quality_score,
            distractor_type,
            similarity_score,
            creation_method
        )
        SELECT DISTINCT
            target_word_id,
            s.definition,
            0.7, -- Good score for antonyms
            'antonym',
            0.6,
            'wordnet'
        FROM word_synsets ws
        JOIN relationships r ON ws.synset_id = r.from_synset_id
        JOIN synsets s ON r.to_synset_id = s.id
        WHERE ws.word_id = target_word_id
        AND r.relationship_type = 'antonym'
        AND NOT EXISTS (
            SELECT 1 FROM word_distractors 
            WHERE word_id = target_word_id 
            AND distractor_definition = s.definition
        )
        LIMIT (distractor_count - inserted_count);
        
        GET DIAGNOSTICS inserted_count = inserted_count + ROW_COUNT;
    END IF;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to prepare distractors for upcoming daily words
CREATE OR REPLACE FUNCTION prepare_daily_word_distractors()
RETURNS INTEGER AS $$
DECLARE
    daily_word_record RECORD;
    words_processed INTEGER := 0;
    distractors_generated INTEGER := 0;
BEGIN
    -- For each upcoming daily word (next 7 days)
    FOR daily_word_record IN 
        SELECT dw.id, dw.word, dw.difficulty_level, w.id as word_id
        FROM daily_words dw
        JOIN words w ON dw.word = w.word
        WHERE dw.date >= CURRENT_DATE
        AND dw.date < CURRENT_DATE + INTERVAL '7 days'
    LOOP
        -- Check if we have enough distractors already
        IF (SELECT COUNT(*) FROM word_distractors 
            WHERE word_id = daily_word_record.word_id) < 8 THEN
            
            -- Generate additional distractors using WordNet
            distractors_generated := distractors_generated + 
                generate_wordnet_distractors(daily_word_record.word_id, 10);
        END IF;
        
        words_processed := words_processed + 1;
    END LOOP;
    
    RAISE NOTICE 'Processed % daily words, generated % distractors', 
                 words_processed, distractors_generated;
    
    RETURN words_processed;
END;
$$ LANGUAGE plpgsql; 