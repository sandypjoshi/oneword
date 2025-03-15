require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Test words of varying difficulty levels
const TEST_WORDS = [
  'the',         // Very common
  'apple',       // Common
  'question',    // Medium
  'adventure',   // Medium
  'juxtaposition', // Uncommon
  'elucidate',   // Rare
  'recalcitrant'  // Rare
];

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validateResults() {
  console.log('=== Validation Test ===\n');
  
  // Check individual words
  console.log('Individual word test:');
  for (const word of TEST_WORDS) {
    const { data, error } = await supabase
      .from('words')
      .select('id, word, difficulty_score, difficulty_level, frequency')
      .eq('word', word)
      .limit(1);
    
    if (error) {
      console.error(`Error checking "${word}":`, error);
      continue;
    }
    
    if (data && data.length > 0) {
      console.log(`Word: ${word}`);
      console.log(`  Difficulty Score: ${data[0].difficulty_score || 'N/A'}`);
      console.log(`  Difficulty Level: ${data[0].difficulty_level || 'N/A'}`);
      console.log(`  Frequency: ${data[0].frequency || 'N/A'}`);
      console.log();
    } else {
      console.log(`Word "${word}" not found in database.\n`);
    }
  }
  
  // Get statistics
  console.log('\nDatabase statistics:');
  
  // Count by difficulty level
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    const { data, error } = await supabase
      .from('words')
      .select('count')
      .eq('difficulty_level', level);
    
    if (!error && data) {
      console.log(`Words with difficulty "${level}": ${data.length > 0 ? data[0].count : 0}`);
    }
  }
  
  // Count words with difficulty scores
  const { data, error } = await supabase
    .from('words')
    .select('count')
    .not('difficulty_score', 'is', null);
  
  if (!error && data) {
    console.log(`Total words with difficulty scores: ${data.length > 0 ? data[0].count : 0}`);
  }
}

validateResults()
  .then(() => console.log('\nValidation completed.'))
  .catch(err => console.error('Validation error:', err));
