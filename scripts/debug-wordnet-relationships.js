/**
 * Debug script to examine why relationships aren't being extracted
 */

const fs = require('fs');
const path = require('path');

const WORDNET_DIR = path.join(__dirname, '../wordnet-data/dict');

// Sample entry format from file:
// 00001740 03 n 01 entity 0 003 ~ 00001930 n 0000 ~ 00002137 n 0000 ~ 04431553 n 0000 | that which is perceived...

// Function to debug a sample entry
function debugSampleEntry() {
  console.log('Debugging sample WordNet entry...');
  
  // Read first real entry from data.noun
  const nounFile = path.join(WORDNET_DIR, 'data.noun');
  const content = fs.readFileSync(nounFile, 'utf8');
  
  // Find first non-comment line
  const lines = content.split('\n');
  let sampleLine = '';
  for (const line of lines) {
    if (!line.startsWith('  ') && line.trim() !== '') {
      sampleLine = line;
      break;
    }
  }
  
  console.log('Sample line:', sampleLine);
  
  // Parse the line manually
  const parts = sampleLine.split('|');
  const synsetData = parts[0].trim();
  
  console.log('Synset data part:', synsetData);
  
  // Extract synset info
  const synsetRegex = /^(\d{8}) (\d{2}) ([nvarsp]) (\d{2})(.*)/;
  const synsetMatch = synsetData.match(synsetRegex);
  if (!synsetMatch) {
    console.log('Failed to match synset pattern');
    return;
  }
  
  const [, offset, lexFilenum, pos, wordCount, remainder] = synsetMatch;
  console.log('Parsed fields:');
  console.log('- offset:', offset);
  console.log('- lexFilenum:', lexFilenum);
  console.log('- pos:', pos);
  console.log('- wordCount (hex):', wordCount, '(decimal:', parseInt(wordCount, 16), ')');
  console.log('- remainder:', remainder);
  
  // Parse words and pointer count
  let restOfLine = remainder.trim();
  const actualWordCount = parseInt(wordCount, 16);
  console.log(`Skipping ${actualWordCount} words...`);
  
  for (let i = 0; i < actualWordCount; i++) {
    console.log(`Word ${i+1}:`);
    
    // Extract word
    const wordEndPos = restOfLine.indexOf(' ');
    if (wordEndPos === -1) {
      console.log('  ERROR: Cannot find end of word');
      break;
    }
    const word = restOfLine.substring(0, wordEndPos);
    console.log('  Word:', word);
    restOfLine = restOfLine.substring(wordEndPos + 1).trim();
    
    // Extract sense number
    const senseEndPos = restOfLine.indexOf(' ');
    if (senseEndPos === -1) {
      console.log('  ERROR: Cannot find end of sense number');
      break;
    }
    const senseNum = restOfLine.substring(0, senseEndPos);
    console.log('  Sense number:', senseNum);
    restOfLine = restOfLine.substring(senseEndPos + 1).trim();
  }
  
  console.log('After words, rest of line:', restOfLine);
  
  // Extract pointer count - FIXED FORMAT
  // The pointer count is a 3-digit decimal number, not hex
  const ptrCountMatch = restOfLine.match(/^(\d{3})\s/);
  if (!ptrCountMatch) {
    console.log('ERROR: Cannot find pointer count in correct format');
    return;
  }
  
  const ptrCount = parseInt(ptrCountMatch[1], 10);
  console.log('Pointer count:', ptrCount);
  restOfLine = restOfLine.substring(ptrCountMatch[0].length).trim();
  
  // Extract each pointer
  for (let i = 0; i < ptrCount; i++) {
    console.log(`Pointer ${i+1}:`);
    
    // Format: pointer_symbol target_offset target_pos source/target_flags
    const ptrParts = restOfLine.split(' ', 4);
    if (ptrParts.length < 4) {
      console.log('  ERROR: Not enough parts for pointer');
      break;
    }
    
    const [ptrSymbol, targetOffset, targetPos, flags] = ptrParts;
    console.log('  Symbol:', ptrSymbol);
    console.log('  Target offset:', targetOffset);
    console.log('  Target POS:', targetPos);
    console.log('  Flags:', flags);
    console.log('  Target synset ID:', `${targetPos}${targetOffset.padStart(8, '0')}`);
    
    restOfLine = restOfLine.substring(ptrParts.join(' ').length + 1).trim();
  }
  
  console.log('Remaining text:', restOfLine);
}

// Run the debug function
debugSampleEntry(); 