-- Schema for the enrichment_state table
-- Run this SQL in your Supabase SQL Editor to create the table

-- Create the enrichment_state table if it doesn't exist
CREATE TABLE IF NOT EXISTS enrichment_state (
  id SERIAL PRIMARY KEY,
  start_id INTEGER NOT NULL DEFAULT 0,
  total_processed INTEGER NOT NULL DEFAULT 0,
  total_successful INTEGER NOT NULL DEFAULT 0, 
  total_failed INTEGER NOT NULL DEFAULT 0,
  total_skipped INTEGER NOT NULL DEFAULT 0,
  total_marked_eligible INTEGER NOT NULL DEFAULT 0,
  total_marked_ineligible INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  daily_request_count INTEGER NOT NULL DEFAULT 0,
  processing_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_run_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Add any additional state fields you might need
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create an index on the last_updated field for faster queries
CREATE INDEX IF NOT EXISTS enrichment_state_last_updated_idx ON enrichment_state(last_updated);

-- Make sure we have at most one state record by adding a constraint
-- This will prevent having multiple state records and ensure consistency
ALTER TABLE enrichment_state ADD CONSTRAINT single_enrichment_state UNIQUE (id);

-- Add a comment to the table
COMMENT ON TABLE enrichment_state IS 'Stores the current state of the word enrichment process';

-- Insert an initial state record if the table is empty
INSERT INTO enrichment_state (
  start_id, 
  total_processed, 
  total_successful,
  total_failed,
  total_skipped,
  total_marked_eligible,
  total_marked_ineligible,
  daily_request_count
)
SELECT 
  0, -- start_id 
  0, -- total_processed
  0, -- total_successful
  0, -- total_failed
  0, -- total_skipped
  0, -- total_marked_eligible
  0, -- total_marked_ineligible
  0  -- daily_request_count
WHERE NOT EXISTS (SELECT 1 FROM enrichment_state);

-- Add permissions for the service role
-- This allows the Edge Function to access the table
GRANT ALL PRIVILEGES ON TABLE enrichment_state TO service_role;
GRANT USAGE, SELECT ON SEQUENCE enrichment_state_id_seq TO service_role; 