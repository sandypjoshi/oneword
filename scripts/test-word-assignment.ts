import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
// Use CommonJS style imports for ESM modules
const chalk = require('chalk');
const { table } = require('table');
import dotenv from 'dotenv';
import { assignWordsForDateRange, assignWordsForNextDay } from '../lib/utils/wordAssignment';
import { calculateWordDifficulty, DifficultyLevel } from '../lib/utils/wordDifficulty';
import { isWordEligible, WordQualityCheck } from '../lib/utils/wordFilters';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for API responses
interface ConceptNetEdge {
  rel: string;
  start: { term: string };
  end: { term: string };
}

interface DatamuseWord {
  word: string;
  tags: string[];
  numSyllables?: number;
  score?: number;
}

interface WordDifficultyDetails {
  word: string;
  difficulty: {
    score: number;
    level: DifficultyLevel;
    confidence: number;
    metrics: {
      frequency: number;
      semantic: number;
      structural: number;
    };
  };
  dataSources: {
    wordnet: boolean;
    datamuse: boolean;
    frequency: {
      value: number | null;
      source: 'database' | 'datamuse' | 'fallback' | 'none';
    };
    syllables: {
      count: number | null;
      source: 'datamuse' | 'estimated' | 'none';
    };
    domains: string[];
  };
  filterResult: WordQualityCheck;
}

interface TestResults {
  wordsAnalyzed: number;
  filteredWords: {
    word: string;
    reason: string;
  }[];
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  dataSourceStats: {
    wordnetCoverage: number;
    datamuseCoverage: number;
    frequencySources: {
      database: number;
      datamuse: number;
      fallback: number;
      none: number;
    };
  };
  wordDetails: WordDifficultyDetails[];
  assignmentResults: any;
}

// Initialize test results
const testResults: TestResults = {
  wordsAnalyzed: 0,
  filteredWords: [],
  difficultyDistribution: {
    beginner: 0,
    intermediate: 0,
    advanced: 0
  },
  dataSourceStats: {
    wordnetCoverage: 0,
    datamuseCoverage: 0,
    frequencySources: {
      database: 0,
      datamuse: 0,
      fallback: 0,
      none: 0
    }
  },
  wordDetails: [],
  assignmentResults: null
};

// Simple rate limiter
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimitedFetch(url: string) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}

/**
 * Test word filtering with detailed reporting
 */
async function testWordFilters() {
  console.log(chalk.bgBlue.white('\n=== TESTING WORD FILTERS ==='));
  
  // Expanded test word set
  const testWords = [
    // Common words that should be filtered
    'the', 'and', 'happy', 'big', 'run', 'go', 'today',
    // Internet/slang terms
    'LOL', 'OMG', 'BTW', 
    // Contractions & special characters
    "don't", "can't", "it's", "hello!", 
    // Proper nouns
    'JavaScript', 'Python', 'London',
    // Numbers
    '123', 'number1', '1st',
    // Short words
    'hi', 'be', 'to',
    // Words that should pass
    'algorithm', 'ubiquitous', 'ephemeral', 'cat', 'pernicious',
    'paradox', 'mellifluous', 'diligent', 'panacea', 'verbose'
  ];

  const results = [];
  const tableData = [
    [chalk.bold('Word'), chalk.bold('Result'), chalk.bold('Reason')]
  ];

  for (const word of testWords) {
    const result = isWordEligible(word);
    
    // Store results for statistics
    if (!result.isValid) {
      testResults.filteredWords.push({
        word,
        reason: result.reason || 'Unknown reason'
      });
    }
    
    // Format for table display
    tableData.push([
      word,
      result.isValid ? chalk.green('VALID') : chalk.red('FILTERED'),
      result.reason || '-'
    ]);
  }

  console.log(table(tableData));
  console.log(`${chalk.yellow('Total Words:')} ${testWords.length}`);
  console.log(`${chalk.green('Valid Words:')} ${testWords.length - testResults.filteredWords.length}`);
  console.log(`${chalk.red('Filtered Words:')} ${testResults.filteredWords.length}`);
  
  // Group by reason
  const reasonGroups: Record<string, number> = {};
  testResults.filteredWords.forEach(({reason}) => {
    reasonGroups[reason] = (reasonGroups[reason] || 0) + 1;
  });
  
  console.log(chalk.yellow('\nFilter Reasons:'));
  Object.entries(reasonGroups).forEach(([reason, count]) => {
    console.log(`- ${reason}: ${count} words`);
  });
}

/**
 * Gather all data sources for a word and return detailed information
 */
async function gatherWordData(word: string): Promise<WordDifficultyDetails> {
  const details: WordDifficultyDetails = {
    word,
    difficulty: {
      score: 0,
      level: 'intermediate',
      confidence: 0,
      metrics: {
        frequency: 0,
        semantic: 0,
        structural: 0
      }
    },
    dataSources: {
      wordnet: false,
      datamuse: false,
      frequency: {
        value: null,
        source: 'none'
      },
      syllables: {
        count: null,
        source: 'none'
      },
      domains: []
    },
    filterResult: isWordEligible(word)
  };
  
  // 1. Fetch database/WordNet data
  try {
    const { data: wordnetData } = await supabase
      .from('words')
      .select(`
        *,
        word_synsets (
          synset_id,
          sense_number,
          tag_count,
          synsets (
            pos,
            definition,
            domain
          )
        )
      `)
      .eq('word', word.toLowerCase())
      .limit(1);
    
    if (wordnetData?.[0]) {
      details.dataSources.wordnet = true;
      
      // Check database frequency
      if (wordnetData[0].frequency !== null && wordnetData[0].frequency !== undefined) {
        details.dataSources.frequency = {
          value: wordnetData[0].frequency,
          source: 'database'
        };
      }
      
      // Get domains
      if (wordnetData[0].word_synsets) {
        const domains = wordnetData[0].word_synsets
          .map((ws: any) => ws.synsets?.domain)
          .filter(Boolean) as string[];
        
        details.dataSources.domains = [...new Set(domains)];
      }
    }
  } catch (error) {
    console.error(`Error fetching WordNet data for "${word}":`, error);
  }
  
  // 2. Fetch Datamuse data
  try {
    const response = await rateLimitedFetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=fps`
    );
    const datamuseData = await response.json() as DatamuseWord[];
    
    if (datamuseData?.[0]) {
      details.dataSources.datamuse = true;
      
      // Get frequency if not already from database
      if (details.dataSources.frequency.source === 'none') {
        const frequencyTag = datamuseData[0].tags?.find(tag => tag.startsWith('f:'));
        if (frequencyTag) {
          const frequencyValue = parseFloat(frequencyTag.split(':')[1]);
          details.dataSources.frequency = {
            value: Math.min(frequencyValue / 8, 1), // Normalize to 0-1
            source: 'datamuse'
          };
        }
      }
      
      // Get syllable count
      if (datamuseData[0].numSyllables !== undefined) {
        details.dataSources.syllables = {
          count: datamuseData[0].numSyllables,
          source: 'datamuse'
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching Datamuse data for "${word}":`, error);
  }
  
  // 3. Calculate difficulty using our algorithm
  try {
    const difficultyResult = await calculateWordDifficulty(word);
    details.difficulty = difficultyResult;
    
    // If we didn't get syllables from Datamuse, estimate them
    if (details.dataSources.syllables.source === 'none') {
      // Estimate syllables based on vowel groups
      const vowels = 'aeiouy';
      let count = 0;
      let prevIsVowel = false;
      
      for (const char of word.toLowerCase()) {
        const isVowel = vowels.includes(char);
        if (isVowel && !prevIsVowel) {
          count++;
        }
        prevIsVowel = isVowel;
      }
      
      details.dataSources.syllables = {
        count: Math.max(1, count),
        source: 'estimated'
      };
    }
    
    // If we still don't have frequency data, use fallback
    if (details.dataSources.frequency.source === 'none') {
      details.dataSources.frequency = {
        value: 0.5, // Default middle difficulty
        source: 'fallback'
      };
    }
  } catch (error) {
    console.error(`Error calculating difficulty for "${word}":`, error);
  }
  
  return details;
}

/**
 * Test difficulty calculation with detailed breakdown
 */
async function testDifficultyCalculation() {
  console.log(chalk.bgBlue.white('\n=== TESTING DIFFICULTY CALCULATION ==='));
  
  // Expanded test word set
  const testWords = [
    'algorithm', 'computer', 'ephemeral', 'ubiquitous', 'cat',
    'mellifluous', 'pernicious', 'serendipity', 'eloquent', 'vexation',
    'verbose', 'paradigm', 'paradox', 'zenith', 'mitigate'
  ];
  
  console.log(chalk.yellow(`Testing ${testWords.length} words for difficulty calculation...`));
  
  // Gather detailed information for each word
  for (const word of testWords) {
    process.stdout.write(`Processing "${word}"... `);
    
    const wordDetails = await gatherWordData(word);
    testResults.wordDetails.push(wordDetails);
    
    // Update statistics
    testResults.wordsAnalyzed++;
    
    if (wordDetails.difficulty.level === 'beginner') {
      testResults.difficultyDistribution.beginner++;
    } else if (wordDetails.difficulty.level === 'intermediate') {
      testResults.difficultyDistribution.intermediate++;
    } else {
      testResults.difficultyDistribution.advanced++;
    }
    
    if (wordDetails.dataSources.wordnet) {
      testResults.dataSourceStats.wordnetCoverage++;
    }
    
    if (wordDetails.dataSources.datamuse) {
      testResults.dataSourceStats.datamuseCoverage++;
    }
    
    testResults.dataSourceStats.frequencySources[wordDetails.dataSources.frequency.source]++;
    
    console.log(chalk.green('Done'));
  }
  
  // Display detailed results for each word
  console.log(chalk.yellow('\nDetailed Word Analysis:'));
  
  for (const wordDetail of testResults.wordDetails) {
    console.log(chalk.bgYellow.black(`\n${wordDetail.word.toUpperCase()}`));
    
    // Display difficulty scores with color coding
    console.log('Difficulty Assessment:');
    console.log(`- Overall Score: ${formatScore(wordDetail.difficulty.score)}`);
    console.log(`- Level: ${formatDifficultyLevel(wordDetail.difficulty.level)}`);
    console.log(`- Confidence: ${formatConfidence(wordDetail.difficulty.confidence)}`);
    
    // Component scores
    console.log('Component Scores:');
    console.log(`- Frequency: ${formatScore(wordDetail.difficulty.metrics.frequency)} (Weight: 50%)`);
    console.log(`- Semantic: ${formatScore(wordDetail.difficulty.metrics.semantic)} (Weight: 20%)`);
    console.log(`- Structural: ${formatScore(wordDetail.difficulty.metrics.structural)} (Weight: 30%)`);
    
    // Data sources
    console.log('Data Sources:');
    console.log(`- WordNet Data: ${wordDetail.dataSources.wordnet ? chalk.green('Available') : chalk.red('Missing')}`);
    console.log(`- Datamuse Data: ${wordDetail.dataSources.datamuse ? chalk.green('Available') : chalk.red('Missing')}`);
    
    // Frequency information
    console.log('Frequency Information:');
    console.log(`- Value: ${wordDetail.dataSources.frequency.value !== null ? 
      formatScore(wordDetail.dataSources.frequency.value) : chalk.red('None')}`);
    console.log(`- Source: ${formatDataSource(wordDetail.dataSources.frequency.source)}`);
    
    // Syllable information
    console.log('Syllable Information:');
    console.log(`- Count: ${wordDetail.dataSources.syllables.count || chalk.red('Unknown')}`);
    console.log(`- Source: ${formatDataSource(wordDetail.dataSources.syllables.source)}`);
    
    // Domains (if available)
    if (wordDetail.dataSources.domains.length > 0) {
      console.log('Domains:', wordDetail.dataSources.domains.join(', '));
    } else {
      console.log('Domains: None');
    }
    
    // Filter result
    console.log('Eligibility:');
    console.log(`- Result: ${wordDetail.filterResult.isValid ? 
      chalk.green('ELIGIBLE') : chalk.red('FILTERED')}`);
    
    if (!wordDetail.filterResult.isValid) {
      console.log(`- Reason: ${wordDetail.filterResult.reason}`);
    }
  }
  
  // Summary statistics
  console.log(chalk.yellow('\nDifficulty Distribution:'));
  const totalWords = testResults.wordsAnalyzed;
  console.log(`- Beginner: ${testResults.difficultyDistribution.beginner} (${formatPercentage(testResults.difficultyDistribution.beginner / totalWords)})`);
  console.log(`- Intermediate: ${testResults.difficultyDistribution.intermediate} (${formatPercentage(testResults.difficultyDistribution.intermediate / totalWords)})`);
  console.log(`- Advanced: ${testResults.difficultyDistribution.advanced} (${formatPercentage(testResults.difficultyDistribution.advanced / totalWords)})`);
  
  console.log(chalk.yellow('\nData Source Coverage:'));
  console.log(`- WordNet: ${testResults.dataSourceStats.wordnetCoverage} words (${formatPercentage(testResults.dataSourceStats.wordnetCoverage / totalWords)})`);
  console.log(`- Datamuse: ${testResults.dataSourceStats.datamuseCoverage} words (${formatPercentage(testResults.dataSourceStats.datamuseCoverage / totalWords)})`);
  
  console.log(chalk.yellow('\nFrequency Data Sources:'));
  console.log(`- Database: ${testResults.dataSourceStats.frequencySources.database} words (${formatPercentage(testResults.dataSourceStats.frequencySources.database / totalWords)})`);
  console.log(`- Datamuse: ${testResults.dataSourceStats.frequencySources.datamuse} words (${formatPercentage(testResults.dataSourceStats.frequencySources.datamuse / totalWords)})`);
  console.log(`- Fallback: ${testResults.dataSourceStats.frequencySources.fallback} words (${formatPercentage(testResults.dataSourceStats.frequencySources.fallback / totalWords)})`);
  console.log(`- None: ${testResults.dataSourceStats.frequencySources.none} words (${formatPercentage(testResults.dataSourceStats.frequencySources.none / totalWords)})`);
}

/**
 * Test word assignment process
 */
async function testWordAssignment() {
  console.log(chalk.bgBlue.white('\n=== TESTING WORD ASSIGNMENT ==='));
  
  try {
    // Test assignment for a single day
    console.log(chalk.yellow('\nDaily Assignment Test:'));
    const dailyResult = await assignWordsForNextDay(3);
    
    console.log('Assignment Results:');
    if (dailyResult && 'existingWords' in dailyResult && dailyResult.existingWords) {
      console.log(chalk.cyan('Words already assigned for tomorrow:'));
      dailyResult.existingWords.forEach((word: any) => {
        console.log(`- ${word.word} (${formatDifficultyLevel(word.difficulty_level)})`);
      });
    } else {
      console.log('Assigned words for next day:', 
        (dailyResult && 'assignedWords' in dailyResult) ? dailyResult.assignedWords : 0);
      
      if (dailyResult && dailyResult.success) {
        console.log(chalk.green('Assignment successful'));
      } else {
        console.log(chalk.red('Assignment failed'));
        console.log('Error:', (dailyResult as any)?.error || 'Unknown error');
      }
    }
    
    // Test assignment for a date range (3 days)
    console.log(chalk.yellow('\nDate Range Assignment Test:'));
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 2); // 3 days
    
    console.log(`Assigning words for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`);
    
    const rangeResult = await assignWordsForDateRange({
      startDate,
      endDate,
      wordsPerDay: 3,
      difficultyDistribution: {
        beginner: 0.4,
        intermediate: 0.4,
        advanced: 0.2
      }
    });
    
    console.log('Assignment Results:');
    console.log(`- Success: ${rangeResult.success ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`- Words Assigned: ${rangeResult.assignedWords || 0}`);
    
    testResults.assignmentResults = {
      daily: dailyResult,
      range: rangeResult
    };
    
  } catch (error) {
    console.error(chalk.red('Word assignment test failed:'), error);
  }
}

// Utility formatting functions
function formatScore(score: number): string {
  if (score === undefined || score === null) return chalk.red('N/A');
  
  const percentage = Math.round(score * 100);
  if (percentage < 33) return chalk.green(`${percentage}%`);
  if (percentage < 67) return chalk.yellow(`${percentage}%`);
  return chalk.red(`${percentage}%`);
}

function formatDifficultyLevel(level: string): string {
  if (level === 'beginner') return chalk.green('Beginner');
  if (level === 'intermediate') return chalk.yellow('Intermediate');
  return chalk.red('Advanced');
}

function formatConfidence(confidence: number): string {
  if (confidence < 0.4) return chalk.red(`Low (${(confidence * 100).toFixed(0)}%)`);
  if (confidence < 0.7) return chalk.yellow(`Medium (${(confidence * 100).toFixed(0)}%)`);
  return chalk.green(`High (${(confidence * 100).toFixed(0)}%)`);
}

function formatDataSource(source: string): string {
  if (source === 'database') return chalk.green('Database');
  if (source === 'datamuse') return chalk.blue('Datamuse API');
  if (source === 'estimated' || source === 'fallback') return chalk.yellow(source.charAt(0).toUpperCase() + source.slice(1));
  return chalk.red('None');
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Run all tests and display summary
 */
async function runAllTests() {
  console.log(chalk.bgGreen.black('\n===== COMPREHENSIVE WORD SELECTION & DIFFICULTY TESTING =====\n'));
  
  try {
    await testWordFilters();
    await testDifficultyCalculation();
    await testWordAssignment();
    
    // Final summary
    console.log(chalk.bgGreen.black('\n===== TEST SUMMARY ====='));
    console.log(`Words Analyzed: ${testResults.wordsAnalyzed}`);
    console.log(`Words Filtered: ${testResults.filteredWords.length}`);
    console.log(`Words with Difficulty Calculated: ${testResults.wordsAnalyzed}`);
    
    console.log('\nData Quality:');
    console.log(`- WordNet Coverage: ${formatPercentage(testResults.dataSourceStats.wordnetCoverage / testResults.wordsAnalyzed)}`);
    console.log(`- Datamuse Coverage: ${formatPercentage(testResults.dataSourceStats.datamuseCoverage / testResults.wordsAnalyzed)}`);
    
    console.log('\nDifficulty Distribution:');
    console.log(`- Beginner: ${formatPercentage(testResults.difficultyDistribution.beginner / testResults.wordsAnalyzed)}`);
    console.log(`- Intermediate: ${formatPercentage(testResults.difficultyDistribution.intermediate / testResults.wordsAnalyzed)}`);
    console.log(`- Advanced: ${formatPercentage(testResults.difficultyDistribution.advanced / testResults.wordsAnalyzed)}`);
    
    console.log(chalk.green('\nAll tests completed successfully!'));
  } catch (error) {
    console.error(chalk.red('\nTest suite failed:'), error);
  }
}

// Run all tests
runAllTests(); 