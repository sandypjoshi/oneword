/**
 * Script to update word difficulty scores in the database
 * Uses the improved difficulty calculation algorithm
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateWordDifficulty } from '../lib/utils/wordDifficulty';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Batch size for processing
const BATCH_SIZE = 20;
// Delay between batches to avoid rate limits (ms)
const BATCH_DELAY = 5000;

// Sleep function for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Process a batch of words
async function processBatch(words: any[], dryRun: boolean = true) {
  const results = [];
  
  for (const word of words) {
    try {
      // Calculate difficulty with our improved algorithm
      const difficulty = await calculateWordDifficulty(word.word);
      
      // Store the result
      results.push({
        id: word.id,
        word: word.word,
        old_score: word.difficulty_score,
        old_level: word.difficulty_level,
        new_score: difficulty.score,
        new_level: difficulty.level,
        changed: word.difficulty_level !== difficulty.level || Math.abs((word.difficulty_score || 0) - difficulty.score) > 0.1
      });
      
      // Update in database if not a dry run
      if (!dryRun && (word.difficulty_score === null || word.difficulty_level === null || results[results.length - 1].changed)) {
        const { error } = await supabase
          .from('words')
          .update({
            difficulty_score: difficulty.score,
            difficulty_level: difficulty.level,
            updated_at: new Date().toISOString()
          })
          .eq('id', word.id);
          
        if (error) {
          console.error(`Error updating word ${word.word}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing word "${word.word}":`, error);
    }
  }
  
  return results;
}

// Main function
async function main() {
  // Parse command line args
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const limit = args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100';
  
  console.log(`WORD DIFFICULTY UPDATE SCRIPT ${dryRun ? '(DRY RUN)' : '(APPLYING CHANGES)'}`);
  console.log('='.repeat(50));
  console.log(`Processing up to ${limit} words${dryRun ? ' (dry run mode)' : ''}`);
  
  if (!dryRun) {
    console.log('\nWARNING: This will update the actual database!');
    console.log('Press Ctrl+C within 5 seconds to cancel...');
    await sleep(5000);
  }
  
  // Get words to process
  const { data: words, error } = await supabase
    .from('words')
    .select('id, word, difficulty_score, difficulty_level')
    .limit(parseInt(limit));
    
  if (error) {
    console.error('Error fetching words:', error);
    process.exit(1);
  }
  
  if (!words || words.length === 0) {
    console.log('No words found to process');
    return;
  }
  
  console.log(`\nFound ${words.length} words to process`);
  
  // Process in batches
  const batches = [];
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    batches.push(words.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Processing in ${batches.length} batches of up to ${BATCH_SIZE} words each`);
  
  // Track counts
  let changedCount = 0;
  let unchangedCount = 0;
  let errorCount = 0;
  
  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    console.log(`\nProcessing batch ${i + 1}/${batches.length} (${batches[i].length} words)`);
    
    try {
      const results = await processBatch(batches[i], dryRun);
      
      // Print results for this batch
      console.log('\nBatch results:');
      console.log('| Word | Old Score | New Score | Old Level | New Level | Changed |');
      console.log('|------|-----------|-----------|-----------|-----------|---------|');
      
      for (const result of results) {
        const oldScore = result.old_score !== null ? result.old_score.toFixed(2) : 'N/A';
        const oldLevel = result.old_level || 'N/A';
        
        console.log(
          `| ${result.word.padEnd(15)} | ${oldScore.padEnd(9)} | ${result.new_score.toFixed(2)} | ` +
          `${oldLevel.padEnd(9)} | ${result.new_level.padEnd(9)} | ${result.changed ? 'YES' : 'NO'} |`
        );
        
        if (result.changed) {
          changedCount++;
        } else {
          unchangedCount++;
        }
      }
      
      // Delay between batches to avoid rate limits
      if (i < batches.length - 1) {
        console.log(`\nWaiting ${BATCH_DELAY / 1000} seconds before next batch...`);
        await sleep(BATCH_DELAY);
      }
    } catch (error) {
      console.error(`Error processing batch ${i + 1}:`, error);
      errorCount++;
    }
  }
  
  // Print summary
  console.log('\nSUMMARY:');
  console.log(`Total words processed: ${words.length}`);
  console.log(`Words with changed difficulty: ${changedCount}`);
  console.log(`Words with unchanged difficulty: ${unchangedCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (dryRun) {
    console.log('\nThis was a dry run. No database changes were made.');
    console.log('Run with --apply flag to update the database.');
  } else {
    console.log('\nDatabase has been updated with new difficulty scores.');
  }
}

// Run the script
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
}); 