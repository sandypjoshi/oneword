require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createConfigTable() {
  console.log('Creating difficulty configuration table...');

  // Create the table using Supabase's RPC
  const { error } = await supabase.rpc('create_difficulty_config_table');

  if (error) {
    console.error('Error creating table:', error);
    
    // Alternative approach: use REST API to create the table via a function
    console.log('Trying alternative approach...');
    
    const { error: functionError } = await supabase
      .functions
      .invoke('create-difficulty-config-table', {
        body: { action: 'create_table' }
      });
      
    if (functionError) {
      console.error('Failed to create table:', functionError);
      console.log('Please create the table manually using Supabase dashboard with SQL:');
      console.log(`
CREATE TABLE IF NOT EXISTS difficulty_config (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  value FLOAT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default values
INSERT INTO difficulty_config (name, value, description)
VALUES 
  ('beginner_threshold', 0.33, 'Max score for beginner level words'),
  ('intermediate_threshold', 0.67, 'Max score for intermediate level words')
ON CONFLICT (name) DO NOTHING;
      `);
      return;
    }
  }

  console.log('Table created successfully.');

  // Initialize default threshold values
  const defaultConfig = [
    {
      name: 'beginner_threshold',
      value: 0.33,
      description: 'Max score for beginner level words'
    },
    {
      name: 'intermediate_threshold',
      value: 0.67,
      description: 'Max score for intermediate level words'
    }
  ];

  console.log('Setting default threshold values...');
  
  for (const config of defaultConfig) {
    const { error } = await supabase
      .from('difficulty_config')
      .upsert(config, { onConflict: 'name' });
      
    if (error) {
      console.error(`Error setting ${config.name}:`, error);
    }
  }

  console.log('Default threshold values set.');

  // Verify the configuration
  const { data, error: getError } = await supabase
    .from('difficulty_config')
    .select('*');
    
  if (getError) {
    console.error('Error fetching config:', getError);
  } else {
    console.log('Current difficulty configuration:');
    console.table(data);
  }
}

createConfigTable()
  .then(() => console.log('Setup completed.'))
  .catch(err => console.error('Error in setup process:', err)); 