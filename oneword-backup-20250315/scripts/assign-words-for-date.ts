/**
 * Script to assign words for a specific date using our improved algorithms
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { isWordEligible } from '../lib/utils/wordFilters';
import { calculateWordDifficulty } from '../lib/utils/wordDifficulty';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Default target date is tomorrow
const DEFAULT_DATE = new Date();
DEFAULT_DATE.setDate(DEFAULT_DATE.getDate() + 1);

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Parse date string in format YYYY-MM-DD
function parseDate(dateString: string): Date {
  return new Date(dateString);
}

// Select words for a specific date
async function selectWordsForDate(targetDate: Date, dryRun: boolean = true, recalculateDifficulty: boolean = true) {
  const dateString = formatDate(targetDate);
  console.log(`\nSELECTING WORDS FOR ${dateString}`);
  console.log('='.repeat(50));
  
  // Check if words already assigned for this date
  const { data: existingAssignments, error: checkError } = await supabase
    .from('daily_words')
    .select('*')
    .eq('date', dateString);
    
  if (checkError) {
    console.error('Error checking existing assignments:', checkError);
    return;
  }
  
  if (existingAssignments && existingAssignments.length > 0) {
    console.log(`Words already assigned for ${dateString}:`);
    console.log('| Difficulty | Word | Score |');
    console.log('|------------|------|-------|');
    
    for (const assignment of existingAssignments) {
      console.log(`| ${assignment.difficulty_level.padEnd(10)} | ${assignment.word.padEnd(20)} | ${assignment.difficulty_score.toFixed(2)} |`);
    }
    
    console.log('\nSkipping assignment as date already has words.');
    return;
  }
  
  // Get recently assigned words (last 90 days) to avoid repetition
  const ninetyDaysAgo = new Date(targetDate);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoString = formatDate(ninetyDaysAgo);
  
  const { data: recentAssignments, error: recentError } = await supabase
    .from('daily_words')
    .select('word')
    .gte('date', ninetyDaysAgoString);
    
  if (recentError) {
    console.error('Error fetching recent assignments:', recentError);
    return;
  }
  
  const recentWords = recentAssignments?.map(a => a.word) || [];
  console.log(`Found ${recentWords.length} words assigned in the last 90 days`);
  
  // Find eligible words for each difficulty level
  const eligibleWordsByLevel: { [key: string]: any[] } = {
    'beginner': [],
    'intermediate': [],
    'advanced': []
  };
  
  // We'll prefer words with pre-calculated difficulty
  const { data: wordsWithDifficulty, error: difficultyError } = await supabase
    .from('words')
    .select('*')
    .not('difficulty_score', 'is', null)
    .order('difficulty_score', { ascending: true })
    .limit(1000);
    
  if (difficultyError) {
    console.error('Error fetching words with difficulty:', difficultyError);
    return;
  }
  
  console.log(`Found ${wordsWithDifficulty?.length || 0} words with pre-calculated difficulty`);
  
  // Filter words and organize by level
  let processedCount = 0;
  let eligibleCount = 0;
  let failedFiltersCount = 0;
  let recentlyUsedCount = 0;
  let recalculatedCount = 0;
  
  for (const word of (wordsWithDifficulty || [])) {
    processedCount++;
    
    // Skip recently used words
    if (recentWords.includes(word.word)) {
      recentlyUsedCount++;
      continue;
    }
    
    // Check word eligibility
    const eligibleCheck = isWordEligible(word.word);
    if (!eligibleCheck.isValid) {
      failedFiltersCount++;
      continue;
    }
    
    // Decide whether to use stored difficulty or recalculate
    let level = word.difficulty_level;
    let score = word.difficulty_score;
    
    // Option to recalculate difficulty for more accurate results
    if (recalculateDifficulty) {
      try {
        const calculatedDifficulty = await calculateWordDifficulty(word.word);
        level = calculatedDifficulty.level;
        score = calculatedDifficulty.score;
        recalculatedCount++;
        
        // Debug: Show differences between stored and calculated
        if (level !== word.difficulty_level) {
          console.log(`Recategorized "${word.word}": ${word.difficulty_level} (${word.difficulty_score.toFixed(2)}) -> ${level} (${score.toFixed(2)})`);
        }
      } catch (error) {
        console.warn(`Error recalculating difficulty for "${word.word}". Using stored values.`);
      }
    }
    
    // Add to appropriate level array
    if (eligibleWordsByLevel[level]) {
      eligibleWordsByLevel[level].push({
        ...word,
        calculated_level: level,
        calculated_score: score
      });
      eligibleCount++;
    }
    
    // Limit processing for performance
    if (eligibleCount >= 300) break;
  }
  
  console.log(`Processed ${processedCount} words`);
  console.log(`Found ${eligibleCount} eligible words (${recentlyUsedCount} skipped as recently used, ${failedFiltersCount} failed filter checks)`);
  if (recalculateDifficulty) {
    console.log(`Recalculated difficulty for ${recalculatedCount} words`);
  }
  
  // Report eligible words by level
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    const count = eligibleWordsByLevel[level].length;
    console.log(`- ${level}: ${count} eligible words`);
  }
  
  // Select one word from each difficulty level, balancing parts of speech
  const selectedWords: any[] = [];
  const selectedPOS: string[] = [];
  
  // Function to select a word with balanced POS
  function selectWordForLevel(level: string) {
    const candidates = eligibleWordsByLevel[level];
    
    if (candidates.length === 0) {
      console.log(`No eligible ${level} words available`);
      return null;
    }
    
    // Group by part of speech
    const byPOS: { [key: string]: any[] } = {};
    for (const word of candidates) {
      const pos = word.pos || 'unknown';
      if (!byPOS[pos]) byPOS[pos] = [];
      byPOS[pos].push(word);
    }
    
    // Sort POS groups by representation in already selected words
    const posGroups = Object.keys(byPOS).sort((a, b) => {
      const aCount = selectedPOS.filter(p => p === a).length;
      const bCount = selectedPOS.filter(p => p === b).length;
      return aCount - bCount; // Least represented first
    });
    
    // Select first word from least represented POS group
    if (posGroups.length > 0) {
      const pos = posGroups[0];
      const selected = byPOS[pos][0];
      
      // Track the selected POS
      selectedPOS.push(pos);
      
      return selected;
    }
    
    // Fallback to any word in this level
    return candidates[0];
  }
  
  // Select one word for each level
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    const selected = selectWordForLevel(level);
    
    if (selected) {
      selectedWords.push({
        ...selected,
        assignment_level: level
      });
      console.log(`Selected ${level} word: "${selected.word}" (${selected.pos || 'unknown'})`);
    }
  }
  
  if (selectedWords.length === 0) {
    console.log('No words selected for assignment.');
    return;
  }
  
  console.log(`\nSelected ${selectedWords.length} words for ${dateString}`);
  
  // Create assignments in database if not dry run
  if (!dryRun) {
    console.log('\nCreating assignments in database...');
    
    for (const word of selectedWords) {
      try {
        // Use calculated values if available, otherwise fall back to stored values
        const difficultyLevel = word.assignment_level;
        const difficultyScore = word.calculated_score || word.difficulty_score;
        
        const { data, error } = await supabase
          .from('daily_words')
          .insert({
            date: dateString,
            word: word.word,
            difficulty_level: difficultyLevel,
            difficulty_score: difficultyScore
          });
          
        if (error) {
          console.error(`Error creating assignment for ${word.word}:`, error);
        } else {
          console.log(`Assigned ${difficultyLevel} word "${word.word}" for ${dateString}`);
        }
      } catch (error) {
        console.error(`Error assigning word ${word.word}:`, error);
      }
    }
    
    console.log('\nAssignments created successfully!');
  } else {
    console.log('\nThis was a dry run. No assignments were created.');
    console.log('Run with --apply to create actual assignments.');
  }
  
  return selectedWords;
}

// Main function
async function main() {
  // Parse command line args
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const noRecalculate = args.includes('--no-recalculate');
  
  // Parse target date
  let targetDate = DEFAULT_DATE;
  const dateArg = args.find(a => a.startsWith('--date='));
  
  if (dateArg) {
    const dateString = dateArg.split('=')[1];
    targetDate = parseDate(dateString);
  }
  
  const dateString = formatDate(targetDate);
  
  console.log(`WORD ASSIGNMENT SCRIPT ${dryRun ? '(DRY RUN)' : '(APPLYING CHANGES)'}`);
  console.log('='.repeat(50));
  console.log(`Target date: ${dateString}${dryRun ? ' (dry run mode)' : ''}`);
  console.log(`Recalculating difficulty: ${!noRecalculate}`);
  
  if (!dryRun) {
    console.log('\nWARNING: This will create assignments in the database!');
    console.log('Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Select and assign words
  await selectWordsForDate(targetDate, dryRun, !noRecalculate);
}

// Run the script
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
}); 