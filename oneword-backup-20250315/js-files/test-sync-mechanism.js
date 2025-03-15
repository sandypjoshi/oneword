require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSyncMechanism() {
  console.log('Testing sync mechanism between words and app_words tables...\n');
  
  // 1. Fetch a sample app_word and its corresponding main word for testing
  const { data: appWord, error: appWordError } = await supabase
    .from('app_words')
    .select('id, word, difficulty_score, source_word_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (appWordError) {
    console.error('Error fetching app_word:', appWordError);
    return;
  }
  
  console.log(`Selected test word: "${appWord.word}" (app_word_id: ${appWord.id}, source_word_id: ${appWord.source_word_id})`);
  console.log(`Current difficulty score: ${appWord.difficulty_score}`);
  console.log(`Last updated: ${new Date(appWord.updated_at).toLocaleString()}`);
  
  // 2. Get the current scores from both tables
  const { data: mainWord, error: mainWordError } = await supabase
    .from('words')
    .select('id, word, difficulty_score, updated_at')
    .eq('id', appWord.source_word_id)
    .single();
  
  if (mainWordError) {
    console.error('Error fetching main word:', mainWordError);
    return;
  }
  
  console.log(`\nBefore update:`);
  console.log(`- Main word score: ${mainWord.difficulty_score}`);
  console.log(`- App word score: ${appWord.difficulty_score}`);
  
  // 3. Update the score in the main words table
  const newScore = Math.random().toFixed(3); // Generate random score between 0 and 1
  console.log(`\nUpdating main word with new score: ${newScore}`);
  
  const { data: updateResult, error: updateError } = await supabase
    .from('words')
    .update({ difficulty_score: newScore })
    .eq('id', mainWord.id)
    .select();
  
  if (updateError) {
    console.error('Error updating main word:', updateError);
    return;
  }
  
  console.log(`Main word updated successfully.`);
  
  // 4. Wait a short time to allow any triggers to execute
  console.log(`\nWaiting 3 seconds for potential trigger/sync to execute...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 5. Check if the app_words record was automatically updated
  const { data: updatedAppWord, error: updatedAppWordError } = await supabase
    .from('app_words')
    .select('id, word, difficulty_score, updated_at')
    .eq('id', appWord.id)
    .single();
  
  if (updatedAppWordError) {
    console.error('Error fetching updated app_word:', updatedAppWordError);
    return;
  }
  
  const { data: updatedMainWord, error: updatedMainWordError } = await supabase
    .from('words')
    .select('id, word, difficulty_score, updated_at')
    .eq('id', mainWord.id)
    .single();
  
  if (updatedMainWordError) {
    console.error('Error fetching updated main word:', updatedMainWordError);
    return;
  }
  
  console.log(`\nAfter update:`);
  console.log(`- Main word score: ${updatedMainWord.difficulty_score}`);
  console.log(`- App word score: ${updatedAppWord.difficulty_score}`);
  console.log(`- Main word updated at: ${new Date(updatedMainWord.updated_at).toLocaleString()}`);
  console.log(`- App word updated at: ${new Date(updatedAppWord.updated_at).toLocaleString()}`);
  
  // 6. Determine if there's automatic sync
  const scoresMatch = Math.abs(updatedMainWord.difficulty_score - updatedAppWord.difficulty_score) < 0.0001;
  const appUpdatedAfterMain = new Date(updatedAppWord.updated_at) > new Date(updatedMainWord.updated_at);
  const timeDiff = (new Date(updatedAppWord.updated_at) - new Date(updatedMainWord.updated_at)) / 1000;
  
  console.log(`\nSync analysis:`);
  console.log(`- Scores match: ${scoresMatch ? '✅ Yes' : '❌ No'}`);
  console.log(`- App word updated after main word: ${appUpdatedAfterMain ? '✅ Yes' : '❌ No'}`);
  console.log(`- Time difference: ${timeDiff.toFixed(2)} seconds`);
  
  if (scoresMatch && appUpdatedAfterMain && timeDiff < 10) {
    console.log(`\n✅ CONCLUSION: An automatic sync mechanism likely exists between words and app_words tables!`);
    console.log(`When the main word's difficulty_score is updated, the app_word's score is automatically updated shortly after.`);
  } else if (scoresMatch && Math.abs(timeDiff) < 0.1) {
    console.log(`\n🤔 CONCLUSION: The tables might be updated simultaneously, possibly through a transaction or API call.`);
  } else {
    console.log(`\n❌ CONCLUSION: No automatic sync mechanism detected. Updates to the main words table do not automatically propagate to app_words.`);
    console.log(`Manual sync or periodic batch jobs might be used to keep the tables in sync.`);
  }
  
  // 7. Restore the original score
  console.log(`\nRestoring original score (${mainWord.difficulty_score}) to main word...`);
  
  const { error: restoreError } = await supabase
    .from('words')
    .update({ difficulty_score: mainWord.difficulty_score })
    .eq('id', mainWord.id);
  
  if (restoreError) {
    console.error('Error restoring original score:', restoreError);
  } else {
    console.log(`Original score restored.`);
  }
}

testSyncMechanism()
  .then(() => console.log('\nTest completed.'))
  .catch(err => console.error('Error during test:', err)); 