require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function compareDifficultyScores() {
  console.log('Comparing difficulty scores between words and app_words tables...\n');
  
  // Fetch a sample of app_words records with their difficulty scores
  const { data: appWords, error: appWordsError } = await supabase
    .from('app_words')
    .select('id, word, difficulty_score, source_word_id, updated_at')
    .not('difficulty_score', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(10);
  
  if (appWordsError) {
    console.error('Error fetching app_words:', appWordsError);
    return;
  }
  
  if (!appWords || appWords.length === 0) {
    console.log('No app_words with difficulty scores found.');
    return;
  }
  
  console.log('Fetched sample app_words with difficulty scores:');
  
  // Create a table to store comparison results
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
      comparisonResults.push({
        app_word_id: appWord.id,
        word: appWord.word,
        app_word_score: appWord.difficulty_score,
        main_word_score: 'ERROR',
        scores_match: false,
        app_updated_at: appWord.updated_at,
        main_updated_at: 'ERROR'
      });
      continue;
    }
    
    // Compare the difficulty scores
    const scoresMatch = Math.abs(appWord.difficulty_score - mainWord.difficulty_score) < 0.0001; // Using small epsilon for float comparison
    
    comparisonResults.push({
      app_word_id: appWord.id,
      main_word_id: mainWord.id,
      word: appWord.word,
      app_word_score: appWord.difficulty_score,
      main_word_score: mainWord.difficulty_score,
      scores_match: scoresMatch,
      app_updated_at: new Date(appWord.updated_at).toLocaleString(),
      main_updated_at: new Date(mainWord.updated_at).toLocaleString()
    });
  }
  
  // Display comparison results
  console.table(comparisonResults);
  
  // Calculate statistics
  const matchCount = comparisonResults.filter(result => result.scores_match).length;
  const totalCount = comparisonResults.length;
  
  console.log(`\nSummary:`);
  console.log(`- Total words compared: ${totalCount}`);
  console.log(`- Words with matching scores: ${matchCount}`);
  console.log(`- Match percentage: ${(matchCount / totalCount * 100).toFixed(2)}%`);
  
  // Check if app_words are being updated after the main words
  const timeDeltas = comparisonResults
    .filter(result => result.main_updated_at !== 'ERROR')
    .map(result => {
      const appTime = new Date(result.app_updated_at).getTime();
      const mainTime = new Date(result.main_updated_at).getTime();
      return {
        word: result.word,
        delta_ms: appTime - mainTime,
        app_after_main: appTime > mainTime
      };
    });
  
  console.log(`\nTiming Analysis:`);
  console.log(`- Words where app_word was updated after main word: ${timeDeltas.filter(d => d.app_after_main).length}/${timeDeltas.length}`);
  
  if (timeDeltas.length > 0) {
    const avgDelta = timeDeltas.reduce((sum, delta) => sum + delta.delta_ms, 0) / timeDeltas.length;
    console.log(`- Average time difference: ${(avgDelta / 1000).toFixed(2)} seconds`);
  }
}

compareDifficultyScores()
  .then(() => console.log('\nComparison completed.'))
  .catch(err => console.error('Error during comparison:', err)); 