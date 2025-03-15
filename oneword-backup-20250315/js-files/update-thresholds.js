require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const beginner = parseFloat(args[0]);
const intermediate = parseFloat(args[1]);

if (isNaN(beginner) || isNaN(intermediate) || beginner >= intermediate) {
  console.log(`
Usage: node update-thresholds.js <beginner_threshold> <intermediate_threshold>

  - beginner_threshold: Value between 0-1, max score for beginner level
  - intermediate_threshold: Value between 0-1, max score for intermediate level
  
Example: node update-thresholds.js 0.4 0.75

This will classify words as:
  - Beginner: score < 0.4
  - Intermediate: 0.4 <= score < 0.75
  - Advanced: score >= 0.75
  
Note: beginner_threshold must be less than intermediate_threshold
  `);
  process.exit(1);
}

async function updateThresholds() {
  console.log(`Updating difficulty thresholds:
- Beginner: score < ${beginner}
- Intermediate: ${beginner} <= score < ${intermediate}
- Advanced: score >= ${intermediate}
`);

  // Update beginner threshold
  const { error: beginnerError } = await supabase
    .from('difficulty_config')
    .upsert({ 
      name: 'beginner_threshold', 
      value: beginner,
      description: 'Max score for beginner level words'
    });

  if (beginnerError) {
    console.error('Error updating beginner threshold:', beginnerError);
    return;
  }

  // Update intermediate threshold
  const { error: intermediateError } = await supabase
    .from('difficulty_config')
    .upsert({ 
      name: 'intermediate_threshold', 
      value: intermediate,
      description: 'Max score for intermediate level words'
    });

  if (intermediateError) {
    console.error('Error updating intermediate threshold:', intermediateError);
    return;
  }

  console.log('Thresholds updated successfully!');
  
  // Fetch current configuration
  const { data, error } = await supabase
    .from('difficulty_config')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching configuration:', error);
  } else {
    console.log('\nCurrent configuration:');
    console.table(data);
  }
  
  console.log('\nTo apply these thresholds to all words in the database, run:');
  console.log('node update-database.js');
}

updateThresholds()
  .then(() => console.log('Done.'))
  .catch(err => console.error('Error:', err)); 