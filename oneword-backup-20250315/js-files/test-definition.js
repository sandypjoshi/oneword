// Test script for generating a short definition for "ephemeral"

// Common filler words to remove when shortening definitions
const FILLER_WORDS = [
  'a', 'an', 'the', 'that', 'which', 'who', 'whom', 'whose', 'this', 'these', 'those',
  'being', 'having', 'doing', 'especially', 'particularly', 'specifically', 'generally',
  'typically', 'usually', 'often', 'sometimes', 'frequently', 'occasionally', 'rarely',
  'commonly', 'primarily', 'mainly', 'mostly', 'largely', 'chiefly', 'principally'
];

// Function to create short, learner-friendly definitions
function generateShortDefinition(word, fullDefinitions, pos) {
  try {
    // Handle case when definitions is null or empty
    if (!fullDefinitions || (Array.isArray(fullDefinitions) && fullDefinitions.length === 0)) {
      return `A ${pos || 'word'} that refers to ${word}`;
    }

    // Prepare the definitions as an array
    const definitions = Array.isArray(fullDefinitions) 
      ? fullDefinitions 
      : [String(fullDefinitions || '')];
    
    // Get the primary (first) definition
    let primaryDef = definitions[0] || '';
    
    // Remove any content in parentheses
    primaryDef = primaryDef.replace(/\([^)]*\)/g, '').trim();
    
    // Remove introductory phrases like "one who..." or "the act of..."
    primaryDef = primaryDef
      .replace(/^(a|an|the) (person|one|act|quality|state|condition|process) (of|who|that|which) /i, '')
      .replace(/^(someone|something) (who|that|which) /i, '')
      .replace(/^(to|being|having) /i, '')
      .trim();
    
    // Split into words for further processing
    const words = primaryDef.split(/\s+/);
    
    // If the definition is already short, return it as is
    if (words.length <= 15) {
      // Just capitalize the first letter
      return primaryDef.charAt(0).toUpperCase() + primaryDef.slice(1);
    }
    
    // For longer definitions, create a shortened version
    // Keep only essential words (remove filler words if possible)
    let shortWords = [];
    let essentialCount = 0;
    
    for (const word of words) {
      // Keep words that aren't in the filler list, or keep if we don't have enough words yet
      if (!FILLER_WORDS.includes(word.toLowerCase()) || essentialCount < 10) {
        shortWords.push(word);
        essentialCount++;
      }
      
      // Stop once we have enough words
      if (shortWords.length >= 15) {
        break;
      }
    }
    
    // Join the words back into a definition
    let shortDef = shortWords.join(' ');
    
    // Make sure the definition ends with proper punctuation
    if (!shortDef.match(/[.!?]$/)) {
      shortDef += '.';
    }
    
    // Ensure the first letter is capitalized
    shortDef = shortDef.charAt(0).toUpperCase() + shortDef.slice(1);
    
    // Add appropriate prefix based on part of speech
    if (pos) {
      switch (pos.toLowerCase()) {
        case 'verb':
        case 'v':
          if (!shortDef.toLowerCase().startsWith('to ')) {
            shortDef = 'To ' + shortDef.charAt(0).toLowerCase() + shortDef.slice(1);
          }
          break;
        case 'noun':
        case 'n':
          if (!shortDef.toLowerCase().startsWith('a ') && 
              !shortDef.toLowerCase().startsWith('an ') && 
              !shortDef.toLowerCase().startsWith('the ')) {
            const firstChar = shortDef.charAt(0).toLowerCase();
            const article = 'aeiou'.includes(firstChar) ? 'An ' : 'A ';
            shortDef = article + shortDef.charAt(0).toLowerCase() + shortDef.slice(1);
          }
          break;
        case 'adjective':
        case 'adj':
        case 'a':
          // For adjectives, we just need to make sure it's descriptive
          if (shortDef.toLowerCase().startsWith('being ') || 
              shortDef.toLowerCase().startsWith('having ')) {
            // This is already fine
          } else if (!shortDef.match(/ing$/) && !shortDef.match(/ed$/)) {
            shortDef = 'Being ' + shortDef.charAt(0).toLowerCase() + shortDef.slice(1);
          }
          break;
        case 'adverb':
        case 'adv':
        case 'r':
          if (!shortDef.toLowerCase().startsWith('in ') && 
              !shortDef.toLowerCase().startsWith('with ') &&
              !shortDef.toLowerCase().startsWith('by ')) {
            shortDef = 'In a manner that is ' + shortDef.charAt(0).toLowerCase() + shortDef.slice(1);
          }
          break;
      }
    }
    
    return shortDef;
  } catch (error) {
    console.error(`Error generating definition for ${word}:`, error);
    return `A ${pos || 'word'} related to ${word}`;
  }
}

// Test definitions for "ephemeral"
const testDefinitions = [
  "lasting a very short time; short-lived; transitory",
  "lasting for a very short time, temporary or transient",
  "something that lasts for a very brief time or has a fleeting existence",
  "characterized by a short life span or brief duration"
];

// Test with different parts of speech
const testCases = [
  { pos: 'adjective', definitions: testDefinitions },
  { pos: 'adj', definitions: [testDefinitions[0]] },
  { pos: 'noun', definitions: [testDefinitions[2]] },
  // Test with a very long, complex definition
  { pos: 'adjective', definitions: ["lasting for a very short time, especially having a quality of being temporary, fleeting, passing quickly, or existing only briefly before disappearing or fading away, often used to describe things that are beautiful but quickly lost or transient"] }
];

// Run tests
console.log('===== TESTING SHORT DEFINITION GENERATION FOR "EPHEMERAL" =====\n');

testCases.forEach((testCase, index) => {
  console.log(`Test Case ${index + 1} (${testCase.pos}):`);
  console.log(`Original definition: ${testCase.definitions[0]}`);
  const shortDef = generateShortDefinition('ephemeral', testCase.definitions, testCase.pos);
  console.log(`Short definition: ${shortDef}`);
  console.log('-------------------\n');
});

console.log('===== TEST COMPLETE ====='); 