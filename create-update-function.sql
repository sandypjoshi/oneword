-- Function to update word difficulty scores without affecting the word column
CREATE OR REPLACE FUNCTION update_word_difficulty(
  p_id INT,
  p_difficulty_score FLOAT,
  p_difficulty_level TEXT,
  p_frequency INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE words
  SET 
    difficulty_score = p_difficulty_score,
    difficulty_level = p_difficulty_level,
    frequency = p_frequency,
    updated_at = NOW()
  WHERE id = p_id;
  
  -- Return true if the row was updated (affects 1 row)
  RETURN FOUND;
END;
$$; 