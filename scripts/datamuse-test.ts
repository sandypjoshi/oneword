/**
 * Test script to verify Datamuse API connectivity and response format
 */

import fetch from 'node-fetch';

async function testDatamuseAPI() {
  console.log('TESTING DATAMUSE API CONNECTIVITY');
  console.log('='.repeat(50));
  
  const testWords = ['computer', 'algorithm', 'zenith', 'ubiquitous', 'ephemeral'];
  
  for (const word of testWords) {
    try {
      console.log(`\nTesting word: "${word}"`);
      const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=f`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`Got ${data.length} results from API`);
      
      // Find exact match
      const exactMatch = data.find((w: any) => w.word === word);
      
      if (exactMatch) {
        console.log(`Found exact match: ${JSON.stringify(exactMatch, null, 2)}`);
        
        // Extract frequency data
        if (exactMatch.tags) {
          const freqTag = exactMatch.tags.find((t: string) => t.startsWith('f:'));
          if (freqTag) {
            const freqValue = parseFloat(freqTag.split(':')[1]);
            
            // Constants
            const MAX_EXPECTED_FREQ = 75;
            
            // Test both the old and new normalization
            console.log(`Raw frequency value: ${freqValue}`);
            console.log(`Old normalization (divide by 8): ${(freqValue/8).toFixed(2)}`);
            console.log(`New normalization (divide by ${MAX_EXPECTED_FREQ}): ${(freqValue/MAX_EXPECTED_FREQ).toFixed(2)}`);
            
            // Test our updated algorithm's frequency calculation
            const normalizedFreq = Math.min(freqValue / MAX_EXPECTED_FREQ, 1.0);
            const score = 1 - normalizedFreq;
            const adjustedScore = Math.pow(score, 0.85);
            const finalScore = Math.max(adjustedScore, 0.1);
            
            console.log(`Our UPDATED frequency calculation produces:`);
            console.log(`- Normalized value: ${normalizedFreq.toFixed(2)}`);
            console.log(`- Initial score (1 - normalized): ${score.toFixed(2)}`);
            console.log(`- After applying exponent: ${adjustedScore.toFixed(2)}`);
            console.log(`- Final score (with minimum): ${finalScore.toFixed(2)}`);
          } else {
            console.log('No frequency tag found in the tags');
          }
        } else {
          console.log('No tags property found in the response');
        }
      } else {
        console.log('No exact match found in results, showing first few results:');
        for (let i = 0; i < Math.min(data.length, 3); i++) {
          console.log(`Result ${i+1}: ${JSON.stringify(data[i])}`);
        }
      }
    } catch (error: any) {
      console.error(`Error testing ${word}:`, error.message);
    }
  }
}

// Test frequency threshold for filter with updated normalization
function testFrequencyFilter() {
  console.log('\nTESTING FREQUENCY FILTER THRESHOLD WITH UPDATED NORMALIZATION');
  console.log('='.repeat(50));
  
  const frequencyThreshold = 0.85; // Value from our filter
  const MAX_EXPECTED_FREQ = 75;
  
  const testCases = [
    { word: 'very-common', frequency: 70.0 },
    { word: 'common', frequency: 30.0 },
    { word: 'medium', frequency: 15.0 },
    { word: 'rare', frequency: 5.0 },
    { word: 'very-rare', frequency: 1.0 }
  ];
  
  console.log(`Threshold: ${frequencyThreshold} (words above this are filtered out)\n`);
  
  console.log('| Word | Datamuse f:value | Normalized | Will be filtered? |');
  console.log('|------|-----------------|------------|-------------------|');
  
  for (const testCase of testCases) {
    const normalized = Math.min(testCase.frequency / MAX_EXPECTED_FREQ, 1.0);
    const filtered = normalized > frequencyThreshold;
    
    console.log(
      `| ${testCase.word.padEnd(10)} | ${testCase.frequency.toFixed(1).padEnd(15)} | ` +
      `${normalized.toFixed(2).padEnd(10)} | ${filtered ? 'YES' : 'NO '.padEnd(17)} |`
    );
  }
}

// Test percentage calculation for filter reason with updated normalization
function testPercentageReporting() {
  console.log('\nTESTING PERCENTAGE REPORTING WITH UPDATED NORMALIZATION');
  console.log('='.repeat(50));
  
  const MAX_EXPECTED_FREQ = 75;
  
  const testCases = [
    { frequency: 70.0 }, // Very common
    { frequency: 30.0 }, // Common
    { frequency: 15.0 }, // Medium
    { frequency: 5.0 }   // Rare
  ];
  
  for (const testCase of testCases) {
    const normalized = Math.min(testCase.frequency / MAX_EXPECTED_FREQ, 1.0);
    const percentage = Math.round(normalized * 100);
    
    console.log(`For frequency ${testCase.frequency}:`);
    console.log(`- Normalized: ${normalized.toFixed(2)}`);
    console.log(`- Reported percentage: ${percentage}%`);
    console.log(`- Filter reason would be: "Too common (frequency score: ${percentage}%)"`);
    console.log();
  }
}

// Run all tests
async function runAllTests() {
  await testDatamuseAPI();
  testFrequencyFilter();
  testPercentageReporting();
}

runAllTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 