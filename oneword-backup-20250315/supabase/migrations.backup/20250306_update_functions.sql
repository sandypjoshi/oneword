-- ======================================================
-- Update Functions to Call Edge Functions
-- ======================================================
-- This migration updates the existing SQL functions to call the Edge Functions
-- ======================================================

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Store the service role key as a setting
-- Important: Replace this with your actual service role key before running the migration
-- DO $$ 
-- BEGIN
--   PERFORM set_config('app.supabase_service_role_key', 'your-service-role-key-here', FALSE);
-- END $$;

-- Update the seed_words_for_date_range function to call the Edge Function
CREATE OR REPLACE FUNCTION seed_words_for_date_range(
  start_date DATE,
  end_date DATE
) RETURNS VOID AS $$
DECLARE
  edge_function_url TEXT := 'https://ipljgsggnbdwaomjfuok.supabase.co/functions/v1/seedWordsForDateRange';
  service_role_key TEXT := current_setting('app.supabase_service_role_key', TRUE);
  result JSONB;
BEGIN
  -- Call the Edge Function with the date range
  SELECT content::JSONB INTO result FROM 
  http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    jsonb_build_object(
      'startDate', start_date::TEXT,
      'endDate', end_date::TEXT
    )::TEXT,
    NULL
  ));
  
  -- Log the result
  RAISE NOTICE 'Edge Function Result: %', result;
END;
$$ LANGUAGE plpgsql;

-- Update the add_word_for_next_day function to call the Edge Function
CREATE OR REPLACE FUNCTION add_word_for_next_day() RETURNS VOID AS $$
DECLARE
  latest_date DATE;
  next_date DATE;
  edge_function_url TEXT := 'https://ipljgsggnbdwaomjfuok.supabase.co/functions/v1/addWordForNextDay';
  service_role_key TEXT := current_setting('app.supabase_service_role_key', TRUE);
  result JSONB;
BEGIN
  -- Find the latest date in the daily_words table
  SELECT MAX(date) INTO latest_date FROM daily_words;
  
  -- Calculate the next date
  next_date := latest_date + INTERVAL '1 day';
  
  -- Call the Edge Function to add words for the next day
  SELECT content::JSONB INTO result FROM 
  http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    jsonb_build_object(
      'date', next_date::TEXT
    )::TEXT,
    NULL
  ));
  
  -- Log the result
  RAISE NOTICE 'Edge Function Result: %', result;
END;
$$ LANGUAGE plpgsql; 