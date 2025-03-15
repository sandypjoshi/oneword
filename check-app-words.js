require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAppWordsTable() {
  console.log('Checking app_words table...\n');
  
  // First, check if the table exists by querying its structure
  const { data: tableInfo, error: tableError } = await supabase
    .from('app_words')
    .select('*')
    .limit(1);
  
  if (tableError) {
    console.error('Error accessing app_words table:', tableError);
    console.log('The app_words table may not exist or you may not have access rights.');
    return;
  }
  
  console.log('app_words table exists. Fetching sample data...\n');
  
  // Fetch a sample of records
  const { data: appWords, error: appWordsError } = await supabase
    .from('app_words')
    .select('*')
    .limit(20);
  
  if (appWordsError) {
    console.error('Error fetching app_words data:', appWordsError);
    return;
  }
  
  if (!appWords || appWords.length === 0) {
    console.log('The app_words table exists but appears to be empty.');
    return;
  }
  
  console.log('===== APP_WORDS TABLE SAMPLE DATA =====');
  console.table(appWords);
  
  // Get count of records
  const { count, error: countError } = await supabase
    .from('app_words')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error getting record count:', countError);
  } else {
    console.log(`\nTotal records in app_words table: ${count}`);
  }
  
  // Check column structure based on first record
  if (appWords && appWords.length > 0) {
    console.log('\nColumn structure:');
    const firstRecord = appWords[0];
    Object.keys(firstRecord).forEach(column => {
      const value = firstRecord[column];
      const type = typeof value;
      console.log(`- ${column}: ${type} ${value === null ? '(allows null)' : ''}`);
    });
  }
  
  // Look for records by difficulty level if the column exists
  if (appWords && appWords.length > 0 && Object.keys(appWords[0]).includes('difficulty_level')) {
    // Get counts by difficulty level
    try {
      const { data: beginnerCount, error: beginnerError } = await supabase
        .from('app_words')
        .select('*', { count: 'exact', head: true })
        .eq('difficulty_level', 'beginner');
        
      const { data: intermediateCount, error: intermediateError } = await supabase
        .from('app_words')
        .select('*', { count: 'exact', head: true })
        .eq('difficulty_level', 'intermediate');
        
      const { data: advancedCount, error: advancedError } = await supabase
        .from('app_words')
        .select('*', { count: 'exact', head: true })
        .eq('difficulty_level', 'advanced');
      
      console.log('\nRecords by difficulty level:');
      console.log(`- Beginner: ${beginnerError ? 'Error' : beginnerCount}`);
      console.log(`- Intermediate: ${intermediateError ? 'Error' : intermediateCount}`);
      console.log(`- Advanced: ${advancedError ? 'Error' : advancedCount}`);
    } catch (err) {
      console.log('Error fetching difficulty level counts:', err);
    }
  }
}

checkAppWordsTable()
  .then(() => console.log('\nCheck completed.'))
  .catch(err => console.error('Error during check:', err)); 