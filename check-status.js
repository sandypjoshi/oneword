/**
 * Simple state file checker
 */
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'enrichment-state.json');

// Read the state file and print it
try {
  if (fs.existsSync(STATE_FILE)) {
    const stateData = fs.readFileSync(STATE_FILE, 'utf8');
    const state = JSON.parse(stateData);
    
    console.log('Current Enrichment State:');
    console.log('--------------------------');
    console.log(`Current Word ID: ${state.startId}`);
    console.log(`Total Processed: ${state.totalProcessed}`);
    console.log(`Total Successful: ${state.totalSuccessful}`);
    console.log(`Total Failed: ${state.totalFailed}`);
    console.log(`Total Skipped: ${state.totalSkipped}`);
    console.log(`API Requests Today: ${state.dailyRequestCount}`);
    console.log(`Last Updated: ${new Date(state.lastUpdated).toLocaleString()}`);
    console.log(`Process Started: ${new Date(state.processingStartTime).toLocaleString()}`);
    
    // Check if the enrichment process is running
    try {
      const command = process.platform === 'win32' 
        ? 'tasklist | findstr "node datamuse-enricher.js"' 
        : 'ps aux | grep "[n]ode datamuse-enricher.js"';
      
      const { execSync } = require('child_process');
      const output = execSync(command, { encoding: 'utf8' });
      const isRunning = output.trim().length > 0;
      
      console.log(`\nProcess Status: ${isRunning ? 'RUNNING' : 'STOPPED'}`);
    } catch (error) {
      console.log('\nProcess Status: STOPPED');
    }
  } else {
    console.log('State file not found. The enrichment process may not have started yet.');
  }
} catch (error) {
  console.error(`Error reading state file: ${error.message}`);
} 