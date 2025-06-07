-- OneWord App: Core Schema Setup
-- Migration: 20250607142400_create_core_schema.sql
-- Description: Create theme enum and core tables with constraints

-- Create theme enum type
CREATE TYPE theme_type AS ENUM ('professional', 'creative', 'social', 'intellectual');

-- =============================================================================
-- Table 1: words - Curated vocabulary with theme-based organization
-- =============================================================================
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  theme theme_type NOT NULL,
  sequence_position INTEGER NOT NULL,
  
  -- API enriched content from Free Dictionary API
  pronunciation TEXT,
  pronunciation_audio TEXT,
  part_of_speech TEXT,
  definition TEXT NOT NULL,
  example TEXT,
  etymology TEXT,
  
  -- Future-proofing for ML/personalization
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Critical constraints
  UNIQUE(theme, sequence_position), -- Prevents duplicate positions
  CHECK (sequence_position > 0)
);

-- =============================================================================
-- Table 2: word_options - MCQ options for each word
-- =============================================================================
CREATE TABLE word_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  option_order INTEGER NOT NULL,
  
  -- AI generation metadata
  generation_strategy TEXT, -- 'opposite', 'similar', 'creative'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation constraints
  CHECK (option_order BETWEEN 1 AND 4),
  UNIQUE(word_id, option_order) -- No duplicate option positions
);

-- =============================================================================
-- Table 3: user_profiles - Extended user data
-- =============================================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_themes theme_type[] NOT NULL,
  current_day INTEGER DEFAULT 1,
  streak_count INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  
  -- Settings with validation
  timezone TEXT DEFAULT 'UTC' CHECK (timezone ~ '^[A-Za-z_/]+$'),
  notification_enabled BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Business logic constraints
  CHECK (array_length(selected_themes, 1) > 0), -- Must have at least one theme
  CHECK (current_day > 0),
  CHECK (streak_count >= 0)
);

-- =============================================================================
-- Table 4: user_daily_words - Daily word assignments (core assignment system)
-- =============================================================================
CREATE TABLE user_daily_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  
  -- Journey context
  journey_day INTEGER NOT NULL,
  assigned_date DATE NOT NULL,
  assigned_theme theme_type NOT NULL,
  
  -- Progress tracking
  is_revealed BOOLEAN DEFAULT FALSE,
  attempts_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  revealed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Critical unique constraints (prevents double-assignment bugs)
  UNIQUE(user_id, assigned_date), -- One word per day
  UNIQUE(user_id, journey_day),   -- One word per journey day
  
  -- Validation
  CHECK (journey_day > 0),
  CHECK (attempts_count >= 0),
  CHECK (time_spent_seconds >= 0)
);

-- =============================================================================
-- Table 5: user_word_interactions - Detailed interaction tracking
-- =============================================================================
CREATE TABLE user_word_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  daily_word_id UUID NOT NULL REFERENCES user_daily_words(id) ON DELETE CASCADE,
  
  -- Interaction details
  interaction_type TEXT CHECK (interaction_type IN (
    'guess_attempt', 'pronunciation_play', 'details_view', 
    'card_flip', 'reflection_view'
  )) NOT NULL,
  
  -- Attempt data
  selected_option TEXT,
  is_correct BOOLEAN,
  response_time_ms INTEGER CHECK (response_time_ms >= 0),
  
  -- Flexible data for future features
  interaction_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE words IS 'Curated vocabulary organized by themes with sequential positioning';
COMMENT ON TABLE word_options IS 'Multiple choice options for word learning (1 correct + 3 AI-generated wrong answers)';
COMMENT ON TABLE user_profiles IS 'Extended user data with theme preferences and journey tracking';
COMMENT ON TABLE user_daily_words IS 'Core assignment system - tracks which word each user gets each day';
COMMENT ON TABLE user_word_interactions IS 'Detailed interaction tracking for analytics and future SRS features';

COMMENT ON COLUMN words.sequence_position IS 'Position within theme (1, 2, 3... up to 100 per theme)';
COMMENT ON COLUMN words.difficulty_level IS 'Optional difficulty scoring for future ML/personalization features';
COMMENT ON COLUMN user_profiles.selected_themes IS 'Array of themes user wants to learn (enables round-robin assignment)';
COMMENT ON COLUMN user_daily_words.journey_day IS 'Users personal journey day (not calendar-based)';
COMMENT ON COLUMN user_daily_words.assigned_theme IS 'Which theme was selected via round-robin algorithm';
COMMENT ON COLUMN user_word_interactions.interaction_data IS 'JSONB field for flexible future interaction data'; 