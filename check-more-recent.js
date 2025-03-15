require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkMoreRecentRecords() {
  console.log('Checking more recent records to verify consistent updates...\n');
  
  // Get current time and last few days
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  // Fetch recently updated app_words with pagination
  const limit = 30;  // Increased limit
  const { data: appWords, error: appWordsError } = await supabase
    .from('app_words')
    .select('id, word, difficulty_score, source_word_id, updated_at')
    .gt('updated_at', threeDaysAgo.toISOString())
    .order('updated_at', { ascending: false })
    .limit(limit);
  
  if (appWordsError) {
    console.error('Error fetching recently updated app_words:', appWordsError);
    return;
  }
  
  if (!appWords || appWords.length === 0) {
    console.log('No recently updated app_words found.');
    return;
  }
  
  console.log(`Found ${appWords.length} recently updated app_words.`);
  
  // Group words by update time (day)
  const wordsByDate = {};
  for (const word of appWords) {
    const updateDate = new Date(word.updated_at).toLocaleDateString();
    if (!wordsByDate[updateDate]) {
      wordsByDate[updateDate] = [];
    }
    wordsByDate[updateDate].push(word);
  }
  
  console.log('\nWords grouped by update date:');
  for (const [date, words] of Object.entries(wordsByDate)) {
    console.log(`\n${date}: ${words.length} words`);
    const sampleWords = words.slice(0, 5).map(w => w.word).join(', ');
    console.log(`Sample words: ${sampleWords}${words.length > 5 ? '...' : ''}`);
  }
  
  // Verify matching scores with main words table
  console.log('\nVerifying score matches with main words table...');
  let matchCount = 0;
  let nonMatchCount = 0;
  const nonMatches = [];
  
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
    
    if (scoresMatch) {
      matchCount++;
    } else {
      nonMatchCount++;
      nonMatches.push({
        word: appWord.word,
        app_score: appWord.difficulty_score,
        main_score: mainWord.difficulty_score,
        app_updated: new Date(appWord.updated_at).toLocaleString(),
        main_updated: new Date(mainWord.updated_at).toLocaleString()
      });
    }
  }
  
  console.log(`\nScore match summary:`);
  console.log(`- Total words checked: ${appWords.length}`);
  console.log(`- Words with matching scores: ${matchCount} (${(matchCount / appWords.length * 100).toFixed(2)}%)`);
  console.log(`- Words with non-matching scores: ${nonMatchCount} (${(nonMatchCount / appWords.length * 100).toFixed(2)}%)`);
  
  if (nonMatches.length > 0) {
    console.log('\nWords with non-matching scores:');
    console.table(nonMatches);
  } else {
    console.log('\n✅ All checked words have matching difficulty scores between tables!');
  }
}

checkMoreRecentRecords()
  .then(() => console.log('\nCheck completed.'))
  .catch(err => console.error('Error during check:', err)); 