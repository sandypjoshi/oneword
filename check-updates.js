require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUpdates() {
  console.log('Checking recently updated words...');
  
  // Fetch a sample of recently updated words
  const { data: recentWords, error: recentError } = await supabase
    .from('words')
    .select('id, word, difficulty_score, difficulty_level, frequency, updated_at')
    .order('updated_at', { ascending: false })
    .limit(10);
  
  if (recentError) {
    console.error('Error fetching recent words:', recentError);
    return;
  }
  
  console.log('Recently updated words:');
  console.table(recentWords);
  
  // Get counts by difficulty level
  const { data: countsByLevel, error: countError } = await supabase
    .rpc('count_by_difficulty_level');
  
  if (countError) {
    console.error('Error fetching difficulty level counts:', countError);
    
    // Alternative approach if RPC is not available
    console.log('Trying alternative query for difficulty levels...');
    
    // Get beginner count
    const { data: beginnerData, error: beginnerError } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: false })
      .eq('difficulty_level', 'beginner');
      
    // Get intermediate count  
    const { data: intermediateData, error: intermediateError } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: false })
      .eq('difficulty_level', 'intermediate');
      
    // Get advanced count
    const { data: advancedData, error: advancedError } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: false })
      .eq('difficulty_level', 'advanced');
      
    console.log('\nCount of words by difficulty level:');
    console.log(`Beginner: ${beginnerError ? 'Error' : beginnerData?.length || 0}`);
    console.log(`Intermediate: ${intermediateError ? 'Error' : intermediateData?.length || 0}`);
    console.log(`Advanced: ${advancedError ? 'Error' : advancedData?.length || 0}`);
  } else {
    console.log('\nCount of words by difficulty level:');
    console.table(countsByLevel);
  }
  
  // Check update timestamps
  const { count: updatedCount, error: statsError } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true })
    .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  if (statsError) {
    console.error('Error fetching update stats:', statsError);
  } else {
    console.log(`\nWords updated in the last 24 hours: ${updatedCount}`);
  }
  
  // Check words with null difficulty scores
  const { count: nullCount, error: nullError } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true })
    .is('difficulty_score', null);
  
  if (nullError) {
    console.error('Error fetching null scores:', nullError);
  } else {
    console.log(`Words with null difficulty scores: ${nullCount}`);
  }
}

checkUpdates()
  .then(() => console.log('Check completed.'))
  .catch(err => console.error('Error during check:', err)); 