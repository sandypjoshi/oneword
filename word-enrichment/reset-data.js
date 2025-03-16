#!/usr/bin/env node

/**
 * Reset Enrichment Data Script
 * This standalone script resets all enrichment data in the database
 */

const db = require('./db');

/**
 * Reset enrichment data with confirmation
 */
async function resetData() {
  console.log('=== OneWord Enrichment Data Reset ===');
  console.log('This will clear ALL existing definitions, OWAD phrases, and distractors.');
  console.log('Are you sure you want to reset all data? (y/n)');
  
  // Read input from user
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  process.stdin.once('data', async (input) => {
    const confirmation = input.toString().trim().toLowerCase();
    
    if (confirmation === 'y' || confirmation === 'yes') {
      console.log('Resetting all enrichment data...');
      
      try {
        await db.resetEnrichmentData();
        console.log('Data reset complete. All enrichment data has been cleared.');
        console.log('Progress tracking has also been reset. Processing will start from the beginning.');
      } catch (error) {
        console.error('Error resetting data:', error.message);
      }
    } else {
      console.log('Operation cancelled.');
    }
    
    process.exit(0);
  });
}

// Run the reset function
resetData(); 