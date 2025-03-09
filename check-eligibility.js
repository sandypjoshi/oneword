require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Connect to Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 1000; // Process 1000 words at a time
const ELIGIBILITY_CRITERIA = {
  minLength: 2,
  maxLength: 25,
  allowedCharacters: /^[a-zA-Z]+$/,
};

// Counters
let totalProcessed = 0;
let totalEligible = 0;
let totalIneligible = 0;
let startTime = new Date();

// Process words in batches
async function processWords() {
  try {
    console.log('Starting eligibility check process...');
    
    // Get the highest word ID to determine total count
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('words')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (maxIdError) {
      throw new Error(`Error getting max word ID: ${maxIdError.message}`);
    }
    
    const maxId = maxIdData[0]?.id || 0;
    console.log(`Total words in database: approximately ${maxId}`);
    
    // Process in batches
    let currentBatchStart = 0;
    
    while (currentBatchStart <= maxId) {
      const batchEnd = currentBatchStart + BATCH_SIZE - 1;
      console.log(`Processing batch: IDs ${currentBatchStart} to ${batchEnd}`);
      
      // Fetch a batch of unchecked words
      const { data: words, error } = await supabase
        .from('words')
        .select('id, word')
        .is('enrichment_eligible', null) // Only get words not yet checked
        .gte('id', currentBatchStart)
        .lte('id', batchEnd);
      
      if (error) {
        console.error(`Error fetching words: ${error.message}`);
        currentBatchStart = batchEnd + 1;
        continue;
      }
      
      if (!words || words.length === 0) {
        console.log(`No unchecked words found in batch ${currentBatchStart}-${batchEnd}`);
        currentBatchStart = batchEnd + 1;
        continue;
      }
      
      console.log(`Found ${words.length} unchecked words in this batch`);
      
      // Check eligibility and prepare updates
      const eligibleWords = [];
      const ineligibleWords = [];
      
      for (const wordData of words) {
        const { id, word } = wordData;
        
        // Skip null or undefined words
        if (!word) {
          console.log(`Skipping ID ${id}: Word is null or undefined`);
          totalIneligible++;
          totalProcessed++;
          continue;
        }
        
        const eligibilityResult = checkWordEligibility(word);
        
        if (eligibilityResult.eligible) {
          eligibleWords.push({ 
            id,
            word,
            eligibilityStatus: eligibilityResult.type
          });
          totalEligible++;
        } else {
          ineligibleWords.push({ 
            id,
            word,
            reason: eligibilityResult.reason 
          });
          totalIneligible++;
        }
        
        totalProcessed++;
        
        // Show progress every 1000 words
        if (totalProcessed % 1000 === 0) {
          const elapsed = (new Date() - startTime) / 1000;
          const rate = Math.round(totalProcessed / elapsed);
          console.log(`Processed ${totalProcessed} words (${rate} words/sec). Eligible: ${totalEligible}, Ineligible: ${totalIneligible}`);
        }
      }
      
      // Update eligible words in batch
      if (eligibleWords.length > 0) {
        const { error: eligibleError } = await supabase
          .from('words')
          .upsert(
            eligibleWords.map(({ id, word, eligibilityStatus }) => ({
              id,
              word,
              enrichment_eligible: eligibilityStatus,
              enrichment_ineligible_reason: null,
              updated_at: new Date().toISOString(),
            }))
          );
        
        if (eligibleError) {
          console.error(`Error marking eligible words: ${eligibleError.message}`);
        } else {
          console.log(`Marked ${eligibleWords.length} words as eligible`);
        }
      }
      
      // Update ineligible words in batch
      if (ineligibleWords.length > 0) {
        const { error: ineligibleError } = await supabase
          .from('words')
          .upsert(
            ineligibleWords.map(({ id, word, reason }) => ({
              id,
              word,
              enrichment_eligible: 'ineligible',
              enrichment_ineligible_reason: reason,
              updated_at: new Date().toISOString(),
            }))
          );
        
        if (ineligibleError) {
          console.error(`Error marking ineligible words: ${ineligibleError.message}`);
        } else {
          console.log(`Marked ${ineligibleWords.length} words as ineligible`);
        }
      }
      
      // Move to next batch
      currentBatchStart = batchEnd + 1;
    }
    
    // Final summary
    const elapsed = (new Date() - startTime) / 1000;
    const rate = Math.round(totalProcessed / elapsed);
    console.log('\n=== ELIGIBILITY CHECK COMPLETE ===');
    console.log(`Total words processed: ${totalProcessed}`);
    console.log(`Eligible words: ${totalEligible} (${Math.round(totalEligible/totalProcessed*100)}%)`);
    console.log(`Ineligible words: ${totalIneligible} (${Math.round(totalIneligible/totalProcessed*100)}%)`);
    console.log(`Processing rate: ${rate} words per second`);
    console.log(`Total time: ${Math.round(elapsed)} seconds`);
    console.log('===============================\n');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Check if a word meets eligibility criteria
function checkWordEligibility(word) {
  if (!word) return { eligible: false, reason: 'Word is null or empty' };
  
  // Convert to string and trim
  const normalizedWord = String(word).trim();
  
  // Check length
  if (normalizedWord.length < ELIGIBILITY_CRITERIA.minLength) {
    return { 
      eligible: false, 
      reason: `Word is too short (${normalizedWord.length} < ${ELIGIBILITY_CRITERIA.minLength})`
    };
  }
  
  if (normalizedWord.length > ELIGIBILITY_CRITERIA.maxLength) {
    return { 
      eligible: false, 
      reason: `Word is too long (${normalizedWord.length} > ${ELIGIBILITY_CRITERIA.maxLength})`
    };
  }
  
  // Check for spaces (phrases)
  if (normalizedWord.includes(' ')) {
    return {
      eligible: true,
      type: 'eligible-phrase'
    };
  }
  
  // Check for valid characters (for single words)
  if (!ELIGIBILITY_CRITERIA.allowedCharacters.test(normalizedWord)) {
    return { 
      eligible: false, 
      reason: 'Word contains invalid characters'
    };
  }
  
  return {
    eligible: true,
    type: 'eligible-word'
  };
}

// Start the process
processWords(); 