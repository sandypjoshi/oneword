-- OneWord App: Performance Indexes
-- Migration: 20250607142500_add_performance_indexes.sql
-- Description: Strategic indexes for optimal query performance

-- =============================================================================
-- High-Access Query Optimization
-- =============================================================================

-- Timeline queries (most frequent) - User's 7-day word view
CREATE INDEX idx_user_daily_words_user_date 
  ON user_daily_words(user_id, assigned_date DESC);

-- Timeline query with date filtering optimization
CREATE INDEX idx_user_daily_words_timeline 
  ON user_daily_words(user_id, assigned_date DESC) 
  WHERE assigned_date >= CURRENT_DATE - INTERVAL '7 days';

-- Word lookup by theme and position (for round-robin assignment)
CREATE INDEX idx_words_theme_position 
  ON words(theme, sequence_position);

-- MCQ options lookup (for word learning)
CREATE INDEX idx_word_options_word_id 
  ON word_options(word_id);

-- =============================================================================
-- Analytics and Interaction Tracking
-- =============================================================================

-- User interaction analytics queries
CREATE INDEX idx_user_interactions_analytics 
  ON user_word_interactions(user_id, timestamp DESC);

-- Interaction analysis by daily word
CREATE INDEX idx_user_interactions_daily_word 
  ON user_word_interactions(daily_word_id, interaction_type);

-- =============================================================================
-- Progress Calculation Optimization
-- =============================================================================

-- Theme progress calculation - words completed per theme
CREATE INDEX idx_daily_words_theme_progress 
  ON user_daily_words(user_id, assigned_theme) 
  WHERE is_revealed = true;

-- User streak and activity tracking
CREATE INDEX idx_user_profiles_activity 
  ON user_profiles(last_activity_date DESC, streak_count DESC);

-- =============================================================================
-- Round-Robin Assignment Optimization
-- =============================================================================

-- Next word position lookup within theme
CREATE INDEX idx_words_theme_sequence 
  ON words(theme, sequence_position)
  WHERE sequence_position > 0;

-- User theme selection lookup
CREATE INDEX idx_user_profiles_themes 
  ON user_profiles USING GIN(selected_themes);

-- =============================================================================
-- Admin and Content Management
-- =============================================================================

-- Word management by creation date
CREATE INDEX idx_words_created_at 
  ON words(created_at DESC);

-- MCQ options by creation for content review
CREATE INDEX idx_word_options_created_at 
  ON word_options(created_at DESC);

-- =============================================================================
-- Composite Indexes for Complex Queries
-- =============================================================================

-- User progress with date context
CREATE INDEX idx_user_daily_words_progress 
  ON user_daily_words(user_id, is_revealed, assigned_date DESC);

-- Word interactions with success tracking
CREATE INDEX idx_interactions_success_tracking 
  ON user_word_interactions(user_id, is_correct, timestamp DESC)
  WHERE interaction_type = 'guess_attempt';

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON INDEX idx_user_daily_words_user_date IS 'Optimizes timeline queries for 7-day word view';
COMMENT ON INDEX idx_words_theme_position IS 'Optimizes round-robin word assignment algorithm';
COMMENT ON INDEX idx_daily_words_theme_progress IS 'Optimizes theme progress calculation queries';
COMMENT ON INDEX idx_user_interactions_analytics IS 'Optimizes user behavior analytics queries';
COMMENT ON INDEX idx_user_profiles_themes IS 'Optimizes theme selection and round-robin logic using GIN index'; 