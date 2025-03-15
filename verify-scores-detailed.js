require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyScoresDetailed() {
  console.log('Performing detailed verification of scores between words and app_words tables...\n');
  
  // Check random samples across different difficulty levels
  await checkByDifficultyLevel('beginner');
  await checkByDifficultyLevel('intermediate');
  await checkByDifficultyLevel('advanced');
  
  // Check high frequency words
  await checkHighFrequencyWords();
  
  // Check records updated in the last 24 hours
  await checkRecentlyUpdated();
}

async function checkByDifficultyLevel(level) {
  console.log(`\n----- Checking ${level.toUpperCase()} level words -----`);
  
  // Fetch sample app_words for this difficulty level
  const { data: appWords, error: appWordsError } = await supabase
    .from('app_words')
    .select('id, word, difficulty_score, difficulty_level, source_word_id, updated_at')
    .eq('difficulty_level', level)
    .order('updated_at', { ascending: false })
    .limit(5);
  
  if (appWordsError) {
    console.error(`Error fetching ${level} app_words:`, appWordsError);
    return;
  }
  
  if (!appWords || appWords.length === 0) {
    console.log(`No ${level} app_words found.`);
    return;
  }
  
  await compareWords(appWords, level);
}

async function checkHighFrequencyWords() {
  console.log('\n----- Checking HIGH FREQUENCY words -----');
  
  // Fetch high frequency app_words
  const { data: appWords, error: appWordsError } = await supabase
    .from('app_words')
    .select('id, word, difficulty_score, difficulty_level, source_word_id, updated_at, normalized_frequency')
    .gt('normalized_frequency', 0.8) // High frequency threshold
    .order('normalized_frequency', { ascending: false })
    .limit(5);
  
  if (appWordsError) {
    console.error('Error fetching high frequency app_words:', appWordsError);
    return;
  }
  
  if (!appWords || appWords.length === 0) {
    console.log('No high frequency app_words found.');
    return;
  }
  
  await compareWords(appWords, 'high-frequency');
}

async function checkRecentlyUpdated() {
  console.log('\n----- Checking RECENTLY UPDATED words -----');
  
  // Get current time and 24 hours ago
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Fetch recently updated app_words
  const { data: appWords, error: appWordsError } = await supabase
    .from('app_words')
    .select('id, word, difficulty_score, difficulty_level, source_word_id, updated_at')
    .gt('updated_at', yesterday.toISOString())
    .order('updated_at', { ascending: false })
    .limit(5);
  
  if (appWordsError) {
    console.error('Error fetching recently updated app_words:', appWordsError);
    return;
  }
  
  if (!appWords || appWords.length === 0) {
    console.log('No recently updated app_words found.');
    return;
  }
  
  await compareWords(appWords, 'recently-updated');
}

async function compareWords(appWords, category) {
  console.log(`Found ${appWords.length} ${category} app_words to compare`);
  
  const comparisonResults = [];
  
  // For each app_word, fetch the corresponding word from the main words table
  for (const appWord of appWords) {
    const { data: mainWord, error: mainWordError } = await supabase
      .from('words')
      .select('id, word, difficulty_score, updated_at')
      .eq('id', appWord.source_word_id)
      .single();
    
    if (mainWordError) {
      console.error(`Error fetching main word for app_word ${appWord.id}:`, mainWordError);
      continue;
    }
    
    // Compare the difficulty scores
    const scoresMatch = Math.abs(appWord.difficulty_score - mainWord.difficulty_score) < 0.0001;
    
    comparisonResults.push({
      word: appWord.word,
      app_word_score: appWord.difficulty_score,
      main_word_score: mainWord.difficulty_score,
      difficulty_level: appWord.difficulty_level || 'N/A',
      scores_match: scoresMatch ? '✓' : '✗',
      app_updated: new Date(appWord.updated_at).toLocaleString().split(',')[0],
      freq: appWord.normalized_frequency ? appWord.normalized_frequency.toFixed(2) : 'N/A'
    });
  }
  
  // Display comparison results
  console.table(comparisonResults);
  
  // Calculate match rate
  const matchCount = comparisonResults.filter(result => result.scores_match === '✓').length;
  const matchRate = (matchCount / comparisonResults.length * 100).toFixed(2);
  console.log(`Match rate for ${category} words: ${matchRate}% (${matchCount}/${comparisonResults.length})`);
}

verifyScoresDetailed()
  .then(() => console.log('\nDetailed verification completed.'))
  .catch(err => console.error('Error during verification:', err)); 