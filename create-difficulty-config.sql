-- Create difficulty configuration table
CREATE TABLE IF NOT EXISTS difficulty_config (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  value FLOAT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default threshold values
INSERT INTO difficulty_config (name, value, description)
VALUES 
  ('beginner_threshold', 0.33, 'Max score for beginner level words'),
  ('intermediate_threshold', 0.67, 'Max score for intermediate level words')
ON CONFLICT (name) DO UPDATE 
SET updated_at = NOW();

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_difficulty_config_timestamp ON difficulty_config;
CREATE TRIGGER set_difficulty_config_timestamp
BEFORE UPDATE ON difficulty_config
FOR EACH ROW
EXECUTE FUNCTION update_config_timestamp();

-- Select current configuration
SELECT * FROM difficulty_config; 