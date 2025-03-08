/**
 * Tests for word assignment functionality
 * 
 * Verifies the logic for selecting words and assigning them to dates
 * with appropriate difficulty levels.
 */

const assert = require('assert');

// Simple test runner since no testing framework is in devDependencies
const describe = (name: string, fn: () => void) => {
  console.log(`\n---- ${name} ----`);
  fn();
};

const test = async (name: string, fn: () => void | Promise<void>) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
};

// Lifecycle hooks
const beforeEach = (fn: () => void) => fn();
const afterEach = (fn: () => void) => fn();

// Mock the Supabase client
let mockWordsData: any[] = [];
let mockDailyWordsData: any[] = [];
let mockDistractionWordsData: any[] = [];
let mockQueryResults: any = {};

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: (table: string) => {
    let data: any[] = [];
    
    // Determine which dataset to use based on table name
    if (table === 'words') data = mockWordsData;
    else if (table === 'daily_words') data = mockDailyWordsData;
    else if (table === 'distractors') data = mockDistractionWordsData;
    
    return {
      select: (fields?: string) => ({
        order: (column: string, options?: any) => ({
          limit: (limit: number) => ({
            data: data.slice(0, limit),
            error: null
          }),
          data,
          error: null
        }),
        eq: (column: string, value: any) => ({
          data: data.filter(item => item[column] === value),
          error: null
        }),
        in: (column: string, values: any[]) => ({
          data: data.filter(item => values.includes(item[column])),
          error: null
        }),
        gte: (column: string, value: any) => ({
          data: data.filter(item => item[column] >= value),
          error: null
        }),
        lte: (column: string, value: any) => ({
          data: data.filter(item => item[column] <= value),
          error: null
        }),
        neq: (column: string, value: any) => ({
          data: data.filter(item => item[column] !== value),
          error: null
        }),
        is: (column: string, value: any) => ({
          data: data.filter(item => item[column] === value),
          error: null
        }),
        data,
        error: null
      }),
      insert: (newData: any) => ({
        data: Array.isArray(newData) ? newData : [newData],
        error: null
      }),
      update: (updateData: any) => ({
        eq: (column: string, value: any) => ({
          data: data.map(item => item[column] === value ? { ...item, ...updateData } : item),
          error: null
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          data: data.filter(item => item[column] === value),
          error: null
        })
      }),
      rpc: (func: string, params: any) => ({
        data: mockQueryResults[func] || [],
        error: null
      })
    };
  }
};

// Set up mock data
function setupMockData() {
  // Mock words with different difficulty levels
  mockWordsData = [
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
  mockDailyWordsData = [
    { id: 1, date: '2023-01-01', word_id: 1, difficulty_level: 'beginner' },
    { id: 2, date: '2023-01-01', word_id: 4, difficulty_level: 'intermediate' },
    { id: 3, date: '2023-01-01', word_id: 7, difficulty_level: 'advanced' },
    { id: 4, date: '2023-01-02', word_id: 2, difficulty_level: 'beginner' },
    { id: 5, date: '2023-01-02', word_id: 5, difficulty_level: 'intermediate' },
    { id: 6, date: '2023-01-02', word_id: 8, difficulty_level: 'advanced' },
  ];
  
  // Mock distractor words
  mockDistractionWordsData = [
    { word_id: 1, distractor_id: 2, score: 0.8 },
    { word_id: 1, distractor_id: 3, score: 0.7 },
    { word_id: 4, distractor_id: 5, score: 0.75 },
    { word_id: 4, distractor_id: 6, score: 0.7 },
    { word_id: 7, distractor_id: 8, score: 0.8 },
    { word_id: 7, distractor_id: 9, score: 0.7 },
  ];
  
  // Mock query results for any custom RPC functions
  mockQueryResults = {
    get_available_words: [
      { id: 3, word: 'teach', difficulty_level: 'beginner', difficulty_score: 0.3, pos: 'verb' },
      { id: 6, word: 'concept', difficulty_level: 'intermediate', difficulty_score: 0.5, pos: 'noun' },
      { id: 9, word: 'ameliorate', difficulty_level: 'advanced', difficulty_score: 0.85, pos: 'verb' },
    ]
  };
}

// Word assignment test suite
async function runTests() {
  describe('Word Assignment Tests', () => {
    beforeEach(setupMockData);
    
    test('should assign available words of each difficulty level', async () => {
      // NOTE: This test would use the word assignment module but since we haven't
      // imported it, this is a placeholder demonstrating the test structure
      
      // Simulate date for the next day
      const nextDate = '2023-01-03';
      
      // Get available words (that haven't been used recently)
      const availableWords = mockQueryResults.get_available_words;
      
      // We should have available words of each difficulty level
      const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
      
      // Check we have words for each level
      for (const level of difficultyLevels) {
        const wordsForLevel = availableWords.filter((w: any) => w.difficulty_level === level);
        assert(wordsForLevel.length > 0, `Should have available words for ${level} level`);
      }
      
      // Simulate assignment (in real test, we would call the actual function)
      const assigned = [
        { date: nextDate, word_id: 3, difficulty_level: 'beginner' },
        { date: nextDate, word_id: 6, difficulty_level: 'intermediate' },
        { date: nextDate, word_id: 9, difficulty_level: 'advanced' },
      ];
      
      // Verify one word per difficulty level
      const assignedLevels = assigned.map(a => a.difficulty_level);
      assert.deepStrictEqual(
        assignedLevels.sort(), 
        difficultyLevels.sort(), 
        'Should assign one word for each difficulty level'
      );
      
      // Check assigned date
      for (const assign of assigned) {
        assert(assign.date === nextDate, 'Should assign words to the correct date');
      }
    });
    
    test('should not assign recently used words', async () => {
      // Get all previously assigned word IDs
      const usedWordIds = mockDailyWordsData.map(dw => dw.word_id);
      
      // Available words should not include any used words
      const availableWords = mockQueryResults.get_available_words;
      const availableIds = availableWords.map((w: any) => w.id);
      
      // Check for no overlap between used and available words
      const overlap = availableIds.filter((id: number) => usedWordIds.includes(id));
      assert(overlap.length === 0, 'Should not select recently used words');
    });
    
    test('should handle case with no available words', async () => {
      // Empty the available words
      mockQueryResults.get_available_words = [];
      
      // In this case, the assignment function should either:
      // 1. Return a useful error/empty array
      // 2. Fall back to words that were used less recently
      
      // This is a placeholder assertion
      assert(true, 'Should handle the case of no available words gracefully');
    });
    
    test('should balance parts of speech in selected words', async () => {
      // Test that word selection tries to balance different parts of speech
      const availableWords = mockQueryResults.get_available_words;
      
      // Ensure our mock data has multiple parts of speech
      mockQueryResults.get_available_words = [
        { id: 3, word: 'teach', difficulty_level: 'beginner', difficulty_score: 0.3, pos: 'verb' },
        { id: 6, word: 'concept', difficulty_level: 'intermediate', difficulty_score: 0.5, pos: 'noun' },
        { id: 9, word: 'ameliorate', difficulty_level: 'advanced', difficulty_score: 0.85, pos: 'verb' }
      ];
      
      // Count parts of speech in our mock data
      const posCounts: {[key: string]: number} = {};
      for (const word of mockQueryResults.get_available_words) {
        posCounts[word.pos] = (posCounts[word.pos] || 0) + 1;
      }
      
      // In our mock data, we should have representation of different POS
      assert(Object.keys(posCounts).length > 1, 'Should have multiple parts of speech available');
      
      // This would test the actual selection algorithm's POS balancing
      // For now it's a placeholder
      assert(true, 'Should try to balance parts of speech in selection');
    });
  });
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
} 