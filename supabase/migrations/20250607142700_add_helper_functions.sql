-- OneWord App: Helper Functions & Triggers
-- Migration: 20250607142700_add_helper_functions.sql
-- Description: Automation functions and triggers for data consistency

-- =============================================================================
-- Trigger Function: Auto-update timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_words_updated_at 
  BEFORE UPDATE ON words 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Helper Function: Get next theme in round-robin rotation
-- =============================================================================
CREATE OR REPLACE FUNCTION get_next_theme_for_user(user_uuid UUID)
RETURNS theme_type AS $$
DECLARE
  user_themes theme_type[];
  theme_count INTEGER;
  current_theme_index INTEGER;
  next_theme theme_type;
BEGIN
  -- Get user's selected themes
  SELECT selected_themes INTO user_themes 
  FROM user_profiles 
  WHERE id = user_uuid;
  
  IF user_themes IS NULL THEN
    RAISE EXCEPTION 'User not found or has no selected themes';
  END IF;
  
  theme_count := array_length(user_themes, 1);
  
  -- Calculate which theme should be next based on current_day
  SELECT current_day INTO current_theme_index 
  FROM user_profiles 
  WHERE id = user_uuid;
  
  -- Use modulo for round-robin: (current_day - 1) % theme_count + 1
  next_theme := user_themes[((current_theme_index - 1) % theme_count) + 1];
  
  RETURN next_theme;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Helper Function: Get next word position for theme
-- =============================================================================
CREATE OR REPLACE FUNCTION get_next_position_for_theme(user_uuid UUID, target_theme theme_type)
RETURNS INTEGER AS $$
DECLARE
  max_position INTEGER;
BEGIN
  -- Find the highest sequence position for words this user has been assigned in this theme
  SELECT COALESCE(MAX(w.sequence_position), 0) INTO max_position
  FROM user_daily_words udw
  JOIN words w ON udw.word_id = w.id
  WHERE udw.user_id = user_uuid 
    AND w.theme = target_theme;
  
  -- Return next position (max + 1)
  RETURN max_position + 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Helper Function: Check if user has today's word assigned
-- =============================================================================
CREATE OR REPLACE FUNCTION user_has_todays_word(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_daily_words 
    WHERE user_id = user_uuid 
      AND assigned_date = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Helper Function: Get user's timeline (7 days)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_timeline(user_uuid UUID, days_back INTEGER DEFAULT 3, days_forward INTEGER DEFAULT 3)
RETURNS TABLE (
  assignment_id UUID,
  journey_day INTEGER,
  assigned_date DATE,
  assigned_theme theme_type,
  word_text TEXT,
  is_revealed BOOLEAN,
  attempts_count INTEGER,
  definition TEXT,
  pronunciation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    udw.id as assignment_id,
    udw.journey_day,
    udw.assigned_date,
    udw.assigned_theme,
    w.word as word_text,
    udw.is_revealed,
    udw.attempts_count,
    CASE 
      WHEN udw.is_revealed THEN w.definition 
      ELSE NULL 
    END as definition,
    w.pronunciation
  FROM user_daily_words udw
  JOIN words w ON udw.word_id = w.id
  WHERE udw.user_id = user_uuid
    AND udw.assigned_date >= CURRENT_DATE - INTERVAL '%s days' % days_back
    AND udw.assigned_date <= CURRENT_DATE + INTERVAL '%s days' % days_forward
  ORDER BY udw.assigned_date;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Helper Function: Calculate user progress by theme
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_theme_progress(user_uuid UUID)
RETURNS TABLE (
  theme theme_type,
  words_completed INTEGER,
  current_position INTEGER,
  total_available INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.theme,
    COALESCE(progress.completed, 0) as words_completed,
    COALESCE(progress.current_pos, 1) as current_position,
    theme_totals.total as total_available
  FROM (
    SELECT UNNEST(selected_themes) as theme 
    FROM user_profiles 
    WHERE id = user_uuid
  ) t
  LEFT JOIN (
    SELECT 
      w.theme,
      COUNT(*) FILTER (WHERE udw.is_revealed = true) as completed,
      COALESCE(MAX(w.sequence_position), 0) + 1 as current_pos
    FROM user_daily_words udw
    JOIN words w ON udw.word_id = w.id
    WHERE udw.user_id = user_uuid
    GROUP BY w.theme
  ) progress ON t.theme = progress.theme
  LEFT JOIN (
    SELECT theme, COUNT(*) as total
    FROM words
    GROUP BY theme
  ) theme_totals ON t.theme = theme_totals.theme
  ORDER BY t.theme;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Helper Function: Update user streak
-- =============================================================================
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER;
  last_activity DATE;
  yesterday DATE;
BEGIN
  yesterday := CURRENT_DATE - INTERVAL '1 day';
  
  SELECT streak_count, last_activity_date 
  INTO current_streak, last_activity
  FROM user_profiles 
  WHERE id = user_uuid;
  
  -- If last activity was yesterday, increment streak
  IF last_activity = yesterday THEN
    current_streak := current_streak + 1;
  -- If last activity was today, don't change streak
  ELSIF last_activity = CURRENT_DATE THEN
    -- Keep current streak
    current_streak := current_streak;
  -- Otherwise, reset streak to 1 (starting new streak today)
  ELSE
    current_streak := 1;
  END IF;
  
  -- Update user profile
  UPDATE user_profiles 
  SET 
    streak_count = current_streak,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Validation Function: Ensure MCQ has exactly one correct answer
-- =============================================================================
CREATE OR REPLACE FUNCTION validate_word_mcq_options()
RETURNS TRIGGER AS $$
DECLARE
  correct_count INTEGER;
BEGIN
  -- Count correct options for this word
  SELECT COUNT(*) INTO correct_count
  FROM word_options
  WHERE word_id = NEW.word_id AND is_correct = true;
  
  -- If inserting a correct option and there's already one, reject
  IF NEW.is_correct = true AND correct_count > 1 THEN
    RAISE EXCEPTION 'Word already has a correct option. Only one correct option allowed per word.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply MCQ validation trigger
CREATE TRIGGER validate_mcq_options_trigger
  AFTER INSERT OR UPDATE ON word_options
  FOR EACH ROW EXECUTE FUNCTION validate_word_mcq_options();

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON FUNCTION get_next_theme_for_user IS 'Returns next theme in round-robin rotation for user';
COMMENT ON FUNCTION get_next_position_for_theme IS 'Returns next word position user should get for specific theme';
COMMENT ON FUNCTION user_has_todays_word IS 'Checks if user already has a word assigned for today';
COMMENT ON FUNCTION get_user_timeline IS 'Returns users 7-day word timeline with appropriate data based on reveal status';
COMMENT ON FUNCTION get_user_theme_progress IS 'Calculates progress statistics for each of users selected themes';
COMMENT ON FUNCTION update_user_streak IS 'Updates user streak count based on daily activity';
COMMENT ON FUNCTION validate_word_mcq_options IS 'Ensures each word has exactly one correct MCQ option'; 