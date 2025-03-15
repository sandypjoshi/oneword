-- Create table for storing high-quality pre-computed distractors
CREATE TABLE IF NOT EXISTS word_distractors_high_quality (
  id SERIAL PRIMARY KEY,
  word_id INTEGER REFERENCES words(id),
  distractor_word_id INTEGER REFERENCES words(id),
  distractor_definition TEXT,
  quality_score FLOAT,
  distractor_type VARCHAR(50), -- e.g., 'semantic', 'phonetic', 'taxonomic', 'antonym'
  similarity_score FLOAT,
  creation_method VARCHAR(50), -- e.g., 'wordnet', 'datamuse', 'manual', 'learner_error'
  usage_count INTEGER DEFAULT 0,
  effectiveness_score FLOAT DEFAULT 0.5, -- updated based on user interactions
  is_approved BOOLEAN DEFAULT true, -- auto-approve for now
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_word_distractors_word_id ON word_distractors_high_quality(word_id);
CREATE INDEX IF NOT EXISTS idx_word_distractors_quality ON word_distractors_high_quality(word_id, quality_score);

-- Create function to score distractors based on various metrics
CREATE OR REPLACE FUNCTION score_distractor(
    target_word_id INTEGER, 
    distractor_word_id INTEGER
) RETURNS FLOAT AS $$
DECLARE
    base_score FLOAT := 0.5;
    target_word_record RECORD;
    distractor_record RECORD;
BEGIN
    -- Get word data
    SELECT id, word, pos, difficulty_level, frequency INTO target_word_record FROM words WHERE id = target_word_id;
    SELECT id, word, pos, difficulty_level, frequency INTO distractor_record FROM words WHERE id = distractor_word_id;
    
    -- Part of speech alignment (critical)
    IF target_word_record.pos != distractor_record.pos THEN
        RETURN 0.1; -- Very low score for wrong POS
    END IF;
    
    -- Difficulty alignment (important for balanced questions)
    IF target_word_record.difficulty_level = distractor_record.difficulty_level THEN
        base_score := base_score + 0.15;
    ELSIF 
        (target_word_record.difficulty_level = 'intermediate' AND 
         distractor_record.difficulty_level IN ('beginner', 'advanced')) OR
        (target_word_record.difficulty_level = 'advanced' AND 
         distractor_record.difficulty_level = 'intermediate') OR
        (target_word_record.difficulty_level = 'beginner' AND 
         distractor_record.difficulty_level = 'intermediate')
    THEN
        base_score := base_score + 0.05;
    END IF;
    
    -- Length similarity (prevent length-based guessing)
    IF ABS(length(target_word_record.word) - length(distractor_record.word)) <= 2 THEN
        base_score := base_score + 0.1;
    END IF;
    
    -- Frequency similarity (when available)
    IF target_word_record.frequency IS NOT NULL AND distractor_record.frequency IS NOT NULL THEN
        IF ABS(target_word_record.frequency - distractor_record.frequency) < 1000 THEN
            base_score := base_score + 0.1;
        END IF;
    END IF;
    
    RETURN LEAST(base_score, 1.0); -- Cap at 1.0
END;
$$ LANGUAGE plpgsql;

-- Function to separate definitions from examples in WordNet data
CREATE OR REPLACE FUNCTION separate_definition_examples() 
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    word_record RECORD;
    clean_definition TEXT;
    examples TEXT[];
    current_definition TEXT;
BEGIN
    FOR word_record IN SELECT id, definitions FROM words WHERE definitions IS NOT NULL
    LOOP
        examples := ARRAY[]::TEXT[];
        
        -- Process each definition in the array
        FOR i IN 1..array_length(word_record.definitions, 1)
        LOOP
            current_definition := word_record.definitions[i];
            
            -- Extract examples (in quotes)
            IF position('"' in current_definition) > 0 THEN
                -- Get the part before first quote as clean definition
                clean_definition := substring(current_definition from 1 for position('"' in current_definition) - 1);
                
                -- Get all quoted parts as examples
                examples := array_append(
                    examples, 
                    regexp_replace(
                        substring(current_definition from position('"' in current_definition)), 
                        '^"|"$', 
                        '', 
                        'g'
                    )
                );
                
                -- Update the definitions array with clean definition
                UPDATE words 
                SET 
                    definitions[i] = trim(clean_definition),
                    examples = COALESCE(words.examples, ARRAY[]::TEXT[]) || examples
                WHERE id = word_record.id;
                
                updated_count := updated_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update distractor effectiveness based on user interactions
CREATE OR REPLACE FUNCTION update_distractor_effectiveness(
    distractor_id INTEGER,
    was_selected BOOLEAN
) RETURNS void AS $$
BEGIN
    UPDATE word_distractors_high_quality
    SET 
        usage_count = usage_count + 1,
        effectiveness_score = 
            -- If selected as incorrect answer, it's a more effective distractor
            CASE WHEN was_selected THEN
                ((effectiveness_score * usage_count) + 1) / (usage_count + 1)
            ELSE
                ((effectiveness_score * usage_count)) / (usage_count + 1)
            END
    WHERE id = distractor_id;
END;
$$ LANGUAGE plpgsql; 