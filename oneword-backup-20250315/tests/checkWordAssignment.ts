/**
 * Test script to check word assignment data from our tests
 */

// Mock data that matches what we use in our tests
const mockWordsData = [
  // Beginner words
  { id: 1, word: 'simple', difficulty_level: 'beginner', difficulty_score: 0.2, pos: 'adj' },
  { id: 2, word: 'happy', difficulty_level: 'beginner', difficulty_score: 0.25, pos: 'adj' },
  { id: 3, word: 'teach', difficulty_level: 'beginner', difficulty_score: 0.3, pos: 'verb' },
  
  // Intermediate words
  { id: 4, word: 'moderate', difficulty_level: 'intermediate', difficulty_score: 0.45, pos: 'adj' },
  { id: 5, word: 'analyze', difficulty_level: 'intermediate', difficulty_score: 0.55, pos: 'verb' },
  { id: 6, word: 'concept', difficulty_level: 'intermediate', difficulty_score: 0.5, pos: 'noun' },
  
  // Advanced words
  { id: 7, word: 'abstruse', difficulty_level: 'advanced', difficulty_score: 0.75, pos: 'adj' },
  { id: 8, word: 'diatribe', difficulty_level: 'advanced', difficulty_score: 0.8, pos: 'noun' },
  { id: 9, word: 'ameliorate', difficulty_level: 'advanced', difficulty_score: 0.85, pos: 'verb' },
];

// Mock daily words already assigned
const mockDailyWordsData = [
  { id: 1, date: '2023-01-01', word_id: 1, difficulty_level: 'beginner' },
  { id: 2, date: '2023-01-01', word_id: 4, difficulty_level: 'intermediate' },
  { id: 3, date: '2023-01-01', word_id: 7, difficulty_level: 'advanced' },
  { id: 4, date: '2023-01-02', word_id: 2, difficulty_level: 'beginner' },
  { id: 5, date: '2023-01-02', word_id: 5, difficulty_level: 'intermediate' },
  { id: 6, date: '2023-01-02', word_id: 8, difficulty_level: 'advanced' },
];

// Mock distractor words
const mockDistractionWordsData = [
  { word_id: 1, distractor_id: 2, score: 0.8 },
  { word_id: 1, distractor_id: 3, score: 0.7 },
  { word_id: 4, distractor_id: 5, score: 0.75 },
  { word_id: 4, distractor_id: 6, score: 0.7 },
  { word_id: 7, distractor_id: 8, score: 0.8 },
  { word_id: 7, distractor_id: 9, score: 0.7 },
];

// Mock query results for available words
const mockAvailableWords = [
  { id: 3, word: 'teach', difficulty_level: 'beginner', difficulty_score: 0.3, pos: 'verb' },
  { id: 6, word: 'concept', difficulty_level: 'intermediate', difficulty_score: 0.5, pos: 'noun' },
  { id: 9, word: 'ameliorate', difficulty_level: 'advanced', difficulty_score: 0.85, pos: 'verb' },
];

// Function to show assigned words by date
function showAssignedWordsByDate() {
  const dates = [...new Set(mockDailyWordsData.map(dw => dw.date))].sort();
  
  console.log('DAILY WORDS ASSIGNMENT');
  console.log('======================\n');
  
  // For each date, show the assigned words by difficulty level
  for (const date of dates) {
    console.log(`Date: ${date}`);
    console.log('--------------------------');
    console.log('| Difficulty | Word     | Score | POS  |');
    console.log('|------------|----------|-------|------|');
    
    const dailyWords = mockDailyWordsData.filter(dw => dw.date === date);
    
    for (const dailyWord of dailyWords) {
      const word = mockWordsData.find(w => w.id === dailyWord.word_id);
      
      if (word) {
        console.log(`| ${dailyWord.difficulty_level.padEnd(10)} | ${word.word.padEnd(8)} | ${word.difficulty_score.toFixed(2)} | ${word.pos.padEnd(4)} |`);
      }
    }
    
    console.log();
  }
}

// Function to show available words for next assignment
function showAvailableWords() {
  console.log('AVAILABLE WORDS FOR NEXT ASSIGNMENT');
  console.log('==================================\n');
  
  console.log('| Word       | Difficulty | Score | POS  |');
  console.log('|------------|------------|-------|------|');
  
  for (const word of mockAvailableWords) {
    console.log(`| ${word.word.padEnd(10)} | ${word.difficulty_level.padEnd(10)} | ${word.difficulty_score.toFixed(2)} | ${word.pos.padEnd(4)} |`);
  }
  
  console.log();
}

// Function to show distractor relationships
function showDistractorWords() {
  console.log('DISTRACTOR WORDS');
  console.log('================\n');
  
  console.log('| Word       | Distractor | Score | Relationship |');
  console.log('|------------|------------|-------|-------------|');
  
  for (const distractor of mockDistractionWordsData) {
    const word = mockWordsData.find(w => w.id === distractor.word_id);
    const distractorWord = mockWordsData.find(w => w.id === distractor.distractor_id);
    
    if (word && distractorWord) {
      // Determine relationship type based on POS and score
      let relationship = 'Semantic';
      if (word.pos === distractorWord.pos) {
        relationship = 'Same POS + Semantic';
      }
      
      console.log(`| ${word.word.padEnd(10)} | ${distractorWord.word.padEnd(10)} | ${distractor.score.toFixed(2)} | ${relationship.padEnd(11)} |`);
    }
  }
}

// Run all data reports
function main() {
  showAssignedWordsByDate();
  showAvailableWords();
  showDistractorWords();
  
  console.log('\nWORD ASSIGNMENT LOGIC:');
  console.log('- Words are assigned for each difficulty level (beginner, intermediate, advanced)');
  console.log('- Each date gets exactly one word of each difficulty level');
  console.log('- Words are not reused until a sufficient time has passed');
  console.log('- Word selection balances parts of speech');
  console.log('- Distractors are semantically related words, often with the same part of speech');
}

main(); 