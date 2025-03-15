/**
 * Test script to check filter results for words from our tests
 */

import { isWordEligible, isWordEligibleAdvanced, WordQualityCheck } from '../lib/utils/wordFilters';

// Define test words from our test cases
const testWords = [
  // Valid words from our tests
  'algorithm',
  'tranquil',
  'verbose',
  'paradigm',
  'zenith',
  'juxtapose',
  'ephemeral',
  'cognizant',
  'well-known',
  
  // Invalid words from our tests
  'at',
  'machine learning',
  'word123',
  'America',
  'NASA',
  "don't",
  'word$',
  'the', 
  'and', 
  'very', 
  'good', 
  'like', 
  'big',
  'too-many-hyphens',
  'a-b',
  'hahaha'
];

async function checkFilteredWords() {
  console.log('WORD FILTER ANALYSIS');
  console.log('===================\n');
  
  console.log('| Word | Basic Valid | Reason | Advanced Valid | Advanced Reason |');
  console.log('|------|-------------|--------|---------------|-----------------|');
  
  for (const word of testWords) {
    try {
      const basicResult = isWordEligible(word);
      let advancedResult: WordQualityCheck = { isValid: false, reason: 'Not tested - failed basic check' };
      
      if (basicResult.isValid) {
        // Only check advanced if basic passes
        advancedResult = await isWordEligibleAdvanced(word);
      }
      
      const basicValid = basicResult.isValid ? '✅' : '❌';
      const advancedValid = advancedResult.isValid ? '✅' : '❌';
      
      console.log(`| ${word.padEnd(14)} | ${basicValid} | ${(basicResult.reason || 'Valid').padEnd(20)} | ${advancedValid} | ${(advancedResult.reason || 'Valid').padEnd(20)} |`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      console.log(`| ${word.padEnd(14)} | ERROR | ${errorMessage} | - | - |`);
    }
  }
  
  console.log('\nFILTER EXPLANATION:');
  console.log('- Basic checks: Length, spaces, numbers, proper nouns, special chars, etc.');
  console.log('- Advanced checks: Word frequency from external APIs like Datamuse');
}

checkFilteredWords().catch(error => {
  console.error('Error occurred:', error);
  process.exit(1);
}); 