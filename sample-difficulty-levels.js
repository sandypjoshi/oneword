require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchDifficultyLevelSamples() {
  console.log('Fetching sample words from each difficulty level...\n');
  
  // Fetch beginner words
  const { data: beginnerWords, error: beginnerError } = await supabase
    .from('words')
    .select('id, word, difficulty_score, frequency')
    .eq('difficulty_level', 'beginner')
    .order('difficulty_score', { ascending: true })
    .limit(10);
  
  // Fetch intermediate words
  const { data: intermediateWords, error: intermediateError } = await supabase
    .from('words')
    .select('id, word, difficulty_score, frequency')
    .eq('difficulty_level', 'intermediate')
    .order('difficulty_score', { ascending: true })
    .limit(10);
  
  // Fetch advanced words
  const { data: advancedWords, error: advancedError } = await supabase
    .from('words')
    .select('id, word, difficulty_score, frequency')
    .eq('difficulty_level', 'advanced')
    .order('difficulty_score', { ascending: true })
    .limit(10);
  
  // Display beginner words
  if (beginnerError) {
    console.error('Error fetching beginner words:', beginnerError);
  } else {
    console.log('===== BEGINNER LEVEL WORDS =====');
    console.table(beginnerWords);
    console.log();
  }
  
  // Display intermediate words
  if (intermediateError) {
    console.error('Error fetching intermediate words:', intermediateError);
  } else {
    console.log('===== INTERMEDIATE LEVEL WORDS =====');
    console.table(intermediateWords);
    console.log();
  }
  
  // Display advanced words
  if (advancedError) {
    console.error('Error fetching advanced words:', advancedError);
  } else {
    console.log('===== ADVANCED LEVEL WORDS =====');
    console.table(advancedWords);
    console.log();
  }
  
  // Fetch high frequency words
  const { data: highFreqWords, error: highFreqError } = await supabase
    .from('words')
    .select('id, word, difficulty_score, difficulty_level, frequency')
    .not('frequency', 'is', null)
    .order('frequency', { ascending: false })
    .limit(10);
  
  // Display high frequency words
  if (highFreqError) {
    console.error('Error fetching high frequency words:', highFreqError);
  } else {
    console.log('===== HIGHEST FREQUENCY WORDS =====');
    console.table(highFreqWords);
  }
}

fetchDifficultyLevelSamples()
  .then(() => console.log('Sample fetch completed.'))
  .catch(err => console.error('Error fetching samples:', err)); 