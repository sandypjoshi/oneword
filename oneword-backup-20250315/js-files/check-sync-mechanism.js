require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSyncMechanism() {
  console.log('Investigating the synchronization mechanism between words and app_words tables...\n');
  
  // 1. Check update timestamps on both tables to see if they're exactly the same
  await compareUpdateTimestamps();
  
  // 2. Test updating a word and seeing what happens
  await testUpdate();
  
  // 3. Check if there's API-level mechanisms (e.g., in REST API or functions)
  await checkAPIFunctions();
}

async function compareUpdateTimestamps() {
  console.log('=== COMPARING UPDATE TIMESTAMPS ===');
  console.log('Checking if words and app_words are updated at exactly the same time...\n');
  
  try {
    // Get 10 recently updated records from app_words
    const { data: appWords, error: appError } = await supabase
      .from('app_words')
      .select('id, word, difficulty_score, source_word_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (appError || !appWords || appWords.length === 0) {
      console.error('Could not fetch app_words:', appError?.message || 'No records found');
      return;
    }
    
    const results = [];
    
    for (const appWord of appWords) {
      // Get the corresponding word from the main table
      const { data: mainWord, error: mainError } = await supabase
        .from('words')
        .select('id, word, difficulty_score, updated_at')
        .eq('id', appWord.source_word_id)
        .single();
      
      if (mainError) {
        console.error(`Could not fetch main word for app_word ${appWord.id}:`, mainError.message);
        continue;
      }
      
      const appUpdated = new Date(appWord.updated_at);
      const mainUpdated = new Date(mainWord.updated_at);
      const diffMs = Math.abs(appUpdated - mainUpdated);
      
      results.push({
        word: appWord.word,
        app_updated: appWord.updated_at,
        main_updated: mainWord.updated_at,
        diff_ms: diffMs,
        exact_match: diffMs === 0
      });
    }
    
    // Print results
    console.log('Timestamp comparison results:');
    console.table(results);
    
    // Calculate statistics
    const exactMatches = results.filter(r => r.exact_match).length;
    console.log(`\nExact timestamp matches: ${exactMatches} / ${results.length} (${(exactMatches / results.length * 100).toFixed(2)}%)`);
    
    if (exactMatches > 0) {
      console.log('\nSince timestamps match exactly, this strongly suggests:');
      console.log('1. A database-level transaction is updating both tables atomically, or');
      console.log('2. A trigger is firing to update the other table immediately, or');
      console.log('3. The API/application is making multiple updates in a single request');
    }
  } catch (err) {
    console.error('Error comparing timestamps:', err);
  }
}

async function testUpdate() {
  console.log('\n=== TESTING LIVE UPDATE ===');
  console.log('WARNING: This will modify data in your database.\n');
  
  // First check if we're allowed to proceed
  const { data: safetyCheck } = await supabase
    .from('words')
    .select('count(*)')
    .eq('word', '___test_word_safe_to_update___');
  
  // Only proceed if we have a designated test word
  // Safety check to avoid updating real data
  if (!safetyCheck || safetyCheck.length === 0 || safetyCheck[0].count === 0) {
    console.log('No designated test word found. Skipping live update test for safety.');
    console.log('If you want to run this test, first create a test word with word = "___test_word_safe_to_update___"');
    return;
  }
  
  try {
    // Get the test word
    const { data: testWord, error: testWordError } = await supabase
      .from('words')
      .select('id, word, difficulty_score')
      .eq('word', '___test_word_safe_to_update___')
      .single();
    
    if (testWordError || !testWord) {
      console.error('Error fetching test word:', testWordError?.message || 'No test word found');
      return;
    }
    
    console.log(`Found test word: ${testWord.word} (id: ${testWord.id}, score: ${testWord.difficulty_score})`);
    
    // Generate a new random score
    const newScore = Math.random().toFixed(3);
    console.log(`Updating test word with new score: ${newScore}`);
    
    // Get the app_word before update
    const { data: appWordBefore, error: appBeforeError } = await supabase
      .from('app_words')
      .select('id, difficulty_score, updated_at')
      .eq('source_word_id', testWord.id)
      .single();
    
    if (appBeforeError) {
      console.error('Error fetching app_word before update:', appBeforeError.message);
      return;
    }
    
    console.log(`Current app_word score: ${appWordBefore.difficulty_score}`);
    
    // Update the test word in the main table
    const { data: updateResult, error: updateError } = await supabase
      .from('words')
      .update({ difficulty_score: newScore })
      .eq('id', testWord.id)
      .select();
    
    if (updateError) {
      console.error('Error updating test word:', updateError.message);
      return;
    }
    
    console.log('Update successful, waiting 1 second...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if the app_word was automatically updated
    const { data: appWordAfter, error: appAfterError } = await supabase
      .from('app_words')
      .select('id, difficulty_score, updated_at')
      .eq('source_word_id', testWord.id)
      .single();
    
    if (appAfterError) {
      console.error('Error fetching app_word after update:', appAfterError.message);
      return;
    }
    
    console.log(`\nApp word after main word update:`);
    console.log(`- Score before: ${appWordBefore.difficulty_score}`);
    console.log(`- Score after: ${appWordAfter.difficulty_score}`);
    console.log(`- Score changed: ${appWordBefore.difficulty_score !== appWordAfter.difficulty_score}`);
    console.log(`- New score matches: ${Math.abs(appWordAfter.difficulty_score - newScore) < 0.0001}`);
    console.log(`- Updated at changed: ${appWordBefore.updated_at !== appWordAfter.updated_at}`);
    
    if (Math.abs(appWordAfter.difficulty_score - newScore) < 0.0001) {
      console.log('\n✅ CONFIRMED: Updating the main words table automatically updates the app_words table!');
    } else {
      console.log('\n❌ The app_words table was NOT automatically updated when the main words table was updated.');
    }
    
    // Restore the original score
    console.log('\nRestoring original score...');
    await supabase
      .from('words')
      .update({ difficulty_score: testWord.difficulty_score })
      .eq('id', testWord.id);
  } catch (err) {
    console.error('Error during live update test:', err);
  }
}

async function checkAPIFunctions() {
  console.log('\n=== CHECKING API FUNCTIONS ===');
  
  // In Supabase, this is a bit limited without access to the server-side code
  // We're looking for edge functions or RPC endpoints that might handle this synchronization
  
  try {
    // List some function names that might be related to word difficulty updating
    const possibleFunctionNames = [
      'update_word_difficulty',
      'sync_word_scores',
      'update_word',
      'update_difficulty',
      'manage_word_difficulty'
    ];
    
    console.log('Checking for possible RPC functions that might handle difficulty score synchronization:');
    
    // This is a best-effort attempt, but might not work without proper permissions
    for (const funcName of possibleFunctionNames) {
      try {
        const { data, error } = await supabase.rpc(funcName, {});
        
        // If no error about the function not existing, it might exist
        if (!error || !error.message.includes('function') || !error.message.includes('exist')) {
          console.log(`✓ Function "${funcName}" might exist`);
        }
      } catch (err) {
        // Ignore errors - they're expected
      }
    }
    
    console.log('\nNote: Full API function detection requires server-side access.');
    console.log('Based on our previous tests, the synchronization is likely handled by:');
    console.log('1. A database trigger that updates app_words when words is updated');
    console.log('2. A transaction in the API that updates both tables simultaneously');
    console.log('3. The instant and exact timestamp matching suggests a database-level mechanism');
  } catch (err) {
    console.error('Error checking API functions:', err);
  }
}

checkSyncMechanism()
  .then(() => console.log('\nSync mechanism check completed.'))
  .catch(err => console.error('Error during sync mechanism check:', err)); 