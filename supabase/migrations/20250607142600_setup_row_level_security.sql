-- OneWord App: Row Level Security Setup
-- Migration: 20250607142600_setup_row_level_security.sql
-- Description: Comprehensive RLS policies for secure data access

-- =============================================================================
-- Enable RLS on all user data tables
-- =============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_interactions ENABLE ROW LEVEL SECURITY;

-- Content tables are public read-only (no RLS needed for words/options)
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_options ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- User Profile Policies - Users can only access their own profile
-- =============================================================================
CREATE POLICY user_profiles_select_own ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY user_profiles_insert_own ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY user_profiles_update_own ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY user_profiles_delete_own ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- =============================================================================
-- Daily Words Policies - Users can only access their own word assignments
-- =============================================================================
CREATE POLICY user_daily_words_select_own ON user_daily_words
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE id = user_daily_words.user_id)
  );

CREATE POLICY user_daily_words_insert_own ON user_daily_words
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM user_profiles WHERE id = user_daily_words.user_id)
  );

CREATE POLICY user_daily_words_update_own ON user_daily_words
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE id = user_daily_words.user_id)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM user_profiles WHERE id = user_daily_words.user_id)
  );

-- =============================================================================
-- Interaction Policies - Users can only access their own interactions
-- =============================================================================
CREATE POLICY user_interactions_select_own ON user_word_interactions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE id = user_word_interactions.user_id)
  );

CREATE POLICY user_interactions_insert_own ON user_word_interactions
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM user_profiles WHERE id = user_word_interactions.user_id)
  );

CREATE POLICY user_interactions_update_own ON user_word_interactions
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE id = user_word_interactions.user_id)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM user_profiles WHERE id = user_word_interactions.user_id)
  );

-- =============================================================================
-- Content Policies - Words and options are public read-only
-- =============================================================================
CREATE POLICY words_public_read ON words
  FOR SELECT USING (true);

CREATE POLICY word_options_public_read ON word_options
  FOR SELECT USING (true);

-- =============================================================================
-- Admin Policies - Future admin functionality
-- =============================================================================
-- Note: Admin policies will be added when admin functionality is implemented
-- For now, content is managed via migrations and direct database access

-- =============================================================================
-- Security Functions for Complex Policies
-- =============================================================================

-- Function to check if user owns a daily word assignment
CREATE OR REPLACE FUNCTION user_owns_daily_word(assignment_id UUID, user_id_to_check UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_daily_words 
    WHERE id = assignment_id AND user_id = user_id_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access word interaction
CREATE OR REPLACE FUNCTION user_owns_interaction(interaction_id UUID, user_id_to_check UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_word_interactions 
    WHERE id = interaction_id AND user_id = user_id_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Grant necessary permissions
-- =============================================================================

-- Allow authenticated users to read words and options
GRANT SELECT ON words TO authenticated;
GRANT SELECT ON word_options TO authenticated;

-- Allow authenticated users full access to their own data
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_daily_words TO authenticated;
GRANT ALL ON user_word_interactions TO authenticated;

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON POLICY user_profiles_select_own ON user_profiles IS 'Users can only view their own profile';
COMMENT ON POLICY user_daily_words_select_own ON user_daily_words IS 'Users can only view their own word assignments';
COMMENT ON POLICY user_interactions_select_own ON user_word_interactions IS 'Users can only view their own learning interactions';
COMMENT ON POLICY words_public_read ON words IS 'All authenticated users can read word content';
COMMENT ON POLICY word_options_public_read ON word_options IS 'All authenticated users can read MCQ options';

COMMENT ON FUNCTION user_owns_daily_word IS 'Security function to verify user ownership of daily word assignments';
COMMENT ON FUNCTION user_owns_interaction IS 'Security function to verify user ownership of word interactions'; 