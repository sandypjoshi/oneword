-- ======================================================
-- Supabase Migration SQL for the OneWord App
-- ======================================================
-- This file contains SQL statements to create the database tables
-- necessary for the OneWord application.
--
-- These migrations should be executed in the Supabase SQL Editor
-- or through the Migrations feature.
-- ======================================================

-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- Table: words
-- Stores detailed information about each word fetched from WordsAPI
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL UNIQUE,
  pronunciation TEXT,
  part_of_speech TEXT,
  definitions TEXT[] NOT NULL,
  examples TEXT[],
  synonyms TEXT[],
  antonyms TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add an index on the word column for faster lookups
  CONSTRAINT words_word_idx UNIQUE (word)
);

-- Create a function to check if a word exists
CREATE OR REPLACE FUNCTION word_exists(word_text TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM words WHERE word = word_text);
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Table: daily_words
-- Maps words to specific dates and difficulty levels
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  options TEXT[] NOT NULL,
  correct_option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a unique constraint to ensure one word per date per difficulty
  CONSTRAINT daily_words_date_difficulty_idx UNIQUE (date, difficulty)
);

-- Create an index for faster date-based lookups
CREATE INDEX IF NOT EXISTS daily_words_date_idx ON daily_words (date);
CREATE INDEX IF NOT EXISTS daily_words_difficulty_idx ON daily_words (difficulty);

-- -----------------------------------------------------
-- Table: user_progress
-- Tracks user interactions with daily words
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  daily_word_id UUID NOT NULL REFERENCES daily_words(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER,
  favorited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a unique constraint to ensure one progress record per device per daily word
  CONSTRAINT user_progress_device_daily_word_idx UNIQUE (device_id, daily_word_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS user_progress_device_id_idx ON user_progress (device_id);
CREATE INDEX IF NOT EXISTS user_progress_favorited_idx ON user_progress (favorited);

-- -----------------------------------------------------
-- Row Level Security Policies
-- -----------------------------------------------------

-- Enable Row Level Security on all tables
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Public can read words and daily_words, but not modify them
CREATE POLICY "Public can read words" ON words
  FOR SELECT USING (true);

CREATE POLICY "Public can read daily words" ON daily_words
  FOR SELECT USING (true);

-- Users can only read/write their own progress
CREATE POLICY "Users can only read their own progress" ON user_progress
  FOR SELECT USING (device_id = current_setting('request.headers.x-device-id', true));

CREATE POLICY "Users can only insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (device_id = current_setting('request.headers.x-device-id', true));

CREATE POLICY "Users can only update their own progress" ON user_progress
  FOR UPDATE USING (device_id = current_setting('request.headers.x-device-id', true));

-- -----------------------------------------------------
-- Functions for the Edge Functions
-- -----------------------------------------------------

-- Function to seed words for a date range
CREATE OR REPLACE FUNCTION seed_words_for_date_range(
  start_date DATE,
  end_date DATE
) RETURNS VOID AS $$
DECLARE
  current_date DATE := start_date;
BEGIN
  -- This is just a placeholder. The actual implementation will be in the Edge Function
  -- which will call WordsAPI and populate the database.
  WHILE current_date <= end_date LOOP
    -- For each date, insert words for each difficulty level
    -- This will be handled by the Edge Function
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to add a new word for the next day
CREATE OR REPLACE FUNCTION add_word_for_next_day() RETURNS VOID AS $$
DECLARE
  latest_date DATE;
  next_date DATE;
BEGIN
  -- Find the latest date in the daily_words table
  SELECT MAX(date) INTO latest_date FROM daily_words;
  
  -- Calculate the next date
  next_date := latest_date + INTERVAL '1 day';
  
  -- The actual implementation will be in the Edge Function
  -- which will call WordsAPI and add words for the next_date.
END;
$$ LANGUAGE plpgsql; 