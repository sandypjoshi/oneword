/**
 * Reset Difficulty Values
 * 
 * This script resets all difficulty scores and levels in the words table.
 * Use this before running a fresh calculation of word difficulties.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Reset difficulty values for a range of words
 * @param {Number} startId - Starting ID
 * @param {Number} limit - Number of records to reset
 */
async function resetDifficultyValues(startId = 0, limit = 100) {
  try {
    console.log(`Starting reset of difficulty values for ${limit} words starting from ID ${startId}...`);
    
    // First, get the IDs of the words we want to reset
    const { data: wordIds, error: fetchError } = await supabase
      .from('words')
      .select('id')
      .gt('id', startId)
      .order('id')
      .limit(limit);
    
    if (fetchError) {
      console.error('Error fetching word IDs:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    console.log(`Found ${wordIds.length} words to reset`);
    
    // Reset values for each word
    let successCount = 0;
    let errorCount = 0;
    
    for (const { id } of wordIds) {
      const { error } = await supabase
        .from('words')
        .update({
          difficulty_score: null,
          difficulty_level: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error(`Error resetting word ID ${id}:`, error);
        errorCount++;
      } else {
        successCount++;
      }
    }
    
    console.log(`Reset complete: ${successCount} successful, ${errorCount} failed`);
    return { 
      success: true, 
      successCount, 
      errorCount,
      totalProcessed: wordIds.length
    };
  } catch (error) {
    console.error('Error in resetDifficultyValues:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const argDict = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = i + 1 < args.length && !args[i + 1].startsWith('--') 
        ? args[i + 1] 
        : true;
      argDict[key] = value;
      if (value !== true) i++; // Skip the value in the next iteration
    }
  }
  
  const startId = parseInt(argDict.start || '0', 10);
  const limit = parseInt(argDict.limit || '100', 10);
  
  const result = await resetDifficultyValues(startId, limit);
  
  if (result.success) {
    console.log('Operation completed successfully');
  } else {
    console.error('Operation failed:', result.error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
}

// Export for testing
module.exports = {
  resetDifficultyValues
}; 