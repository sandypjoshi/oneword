-- ==== ENUM Type Definitions ====

CREATE TYPE difficulty_level_enum AS ENUM (
  'Beginner',
  'Intermediate',
  'Advanced'
);

CREATE TYPE word_learning_status AS ENUM (
  'seen',
  'answered_correctly',
  'learned',
  'reviewed'
);

-- ==== Table Definitions ====

-- 1. Difficulty Levels Table
CREATE TABLE difficulty_levels (
  level difficulty_level_enum PRIMARY KEY,
  description TEXT,
  sort_order SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE difficulty_levels IS 'Stores the defined difficulty levels for words and user preferences.';

-- 2. Words Table (Includes Lemma)
CREATE TABLE words (
  id BIGSERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE, -- Specific inflected form, e.g., 'running'
  lemma TEXT NOT NULL, -- Base form, e.g., 'run'
  pronunciation TEXT,
  -- options JSONB structure: [{"phrase": "Short phrase", "is_correct": boolean, "source_word_id": bigint, "source_definition_id": bigint}, ...]
  options JSONB NOT NULL,
  difficulty_level difficulty_level_enum NOT NULL REFERENCES difficulty_levels(level) ON UPDATE CASCADE ON DELETE RESTRICT,
  datamuse_cache JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE words IS 'Stores vocabulary words (specific forms), their lemma, and pre-compiled quiz options.';
COMMENT ON COLUMN words.word IS 'The specific word form (potentially inflected).';
COMMENT ON COLUMN words.lemma IS 'The base or dictionary form of the word.';
COMMENT ON COLUMN words.options IS 'Pre-compiled JSONB array of quiz options (phrase, correctness, source IDs). Generated from word_definitions.';

-- 3. Word Definitions Table
CREATE TABLE word_definitions (
  id BIGSERIAL PRIMARY KEY,
  word_id BIGINT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  part_of_speech TEXT NOT NULL,
  definition TEXT NOT NULL,
  quiz_phrase TEXT NOT NULL,
  source TEXT NULL, -- Origin of the definition (e.g., WordNet, GPT, manual)
  definition_order SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE word_definitions IS 'Stores distinct definitions for a word, each with a POS, definition text, and representative phrase for quizzes.';
COMMENT ON COLUMN word_definitions.quiz_phrase IS 'Short phrase representing this definition, used as the source for quiz options.';
COMMENT ON COLUMN word_definitions.source IS 'Origin of the definition (e.g., WordNet, GPT, manual).';

-- 4. Word Examples Table
CREATE TABLE word_examples (
  id BIGSERIAL PRIMARY KEY,
  word_definition_id BIGINT NOT NULL REFERENCES word_definitions(id) ON DELETE CASCADE,
  example TEXT NOT NULL,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE word_examples IS 'Stores example sentences, linked to a specific definition of a word.';

-- 5. Daily Schedule Table
CREATE TABLE daily_schedule (
  scheduled_date DATE PRIMARY KEY,
  word_id BIGINT NOT NULL REFERENCES words(id) ON DELETE CASCADE, -- Consider scheduling lemma/concept vs specific form
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE daily_schedule IS 'Assigns a specific word (word_id) to be the "Word of the Day" for a specific date.';
COMMENT ON COLUMN daily_schedule.word_id IS 'FK to the specific word form scheduled. Logic needed to handle lemmas.';

-- 6. Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  difficulty_level difficulty_level_enum NOT NULL DEFAULT 'Intermediate' REFERENCES difficulty_levels(level) ON UPDATE CASCADE ON DELETE SET DEFAULT,
  theme_name TEXT NOT NULL DEFAULT 'default' CHECK (theme_name IN ('default', 'quill')),
  color_mode TEXT NOT NULL DEFAULT 'system' CHECK (color_mode IN ('light', 'dark', 'system')),
  notification_time TIME,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  total_words_learned INTEGER NOT NULL DEFAULT 0 CHECK (total_words_learned >= 0),
  last_completed_date DATE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE profiles IS 'Stores user-specific application data, settings, and aggregated progress, linked to auth.users.';

-- 7. User Word Progress Table
CREATE TABLE user_word_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id BIGINT NOT NULL REFERENCES words(id) ON DELETE CASCADE, -- Tracks progress against specific word form
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  status word_learning_status NOT NULL DEFAULT 'seen',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ,
  learned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, word_id) -- Composite primary key
);
COMMENT ON TABLE user_word_progress IS 'Tracks individual user interaction and learning status for each specific word form.';
COMMENT ON COLUMN user_word_progress.word_id IS 'FK to the specific word form the user interacted with.';
