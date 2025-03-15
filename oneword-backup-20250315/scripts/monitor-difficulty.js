/**
 * Simple monitor for the difficulty calculation process
 * This script will check if the process is running and notify when it's done
 */
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Configuration
const DIFFICULTY_LOG_FILE = path.join(__dirname, '..', 'difficulty-calculation-nohup.log');
const CHECK_INTERVAL_MS = 5000; // Check every 5 seconds
const PROCESS_PATTERN = 'node scripts/calculate-difficulty.js';

// Helper to format date
function formatDate(date) {
  return new Date(date).toLocaleString();
}

// Check if process is running
function isProcessRunning() {
  return new Promise((resolve) => {
    exec(`ps aux | grep "${PROCESS_PATTERN}" | grep -v grep`, (error, stdout) => {
      resolve(stdout.trim() !== '');
    });
  });
}

// Get the latest log information
function getLatestLogInfo() {
  try {
    if (!fs.existsSync(DIFFICULTY_LOG_FILE)) {
      return "Log file not found";
    }
    
    // Get the last 10 lines of the log file
    const log = fs.readFileSync(DIFFICULTY_LOG_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .slice(-10)
      .join('\n');
      
    return log;
  } catch (error) {
    return `Error reading log file: ${error.message}`;
  }
}

// Extract batch information from log
function extractProgressInfo(log) {
  const batchRegex = /Batch #(\d+) complete, processed \d+ words\. Total in this range: (\d+)/;
  const match = log.match(batchRegex);
  
  if (match) {
    return {
      batchNumber: parseInt(match[1]),
      totalProcessed: parseInt(match[2])
    };
  }
  
  return null;
}

// Check status and display
async function checkStatus() {
  const isRunning = await isProcessRunning();
  const latestLog = getLatestLogInfo();
  const progressInfo = extractProgressInfo(latestLog);
  
  console.clear();
  console.log('===== DIFFICULTY CALCULATION MONITOR =====');
  console.log(`Last Checked: ${formatDate(new Date())}`);
  console.log('');
  
  if (isRunning) {
    console.log('Process Status: RUNNING');
    console.log('');
    console.log('=== Latest Log Entries ===');
    console.log(latestLog);
    
    if (progressInfo) {
      console.log('');
      console.log(`Current Batch: #${progressInfo.batchNumber}`);
      console.log(`Words Processed: ${progressInfo.totalProcessed}`);
    }
  } else {
    console.log('Process Status: COMPLETED');
    console.log('');
    console.log('The difficulty calculation script has finished!');
    console.log('');
    console.log('=== Final Log Entries ===');
    console.log(latestLog);
    
    // Stop monitoring
    clearInterval(monitorInterval);
    
    // Send a system notification if possible
    try {
      if (process.platform === 'darwin') {
        exec('osascript -e \'display notification "Difficulty calculation script has completed" with title "Process Complete"\'');
      }
    } catch (e) {
      // Ignore notification errors
    }
  }
  
  return isRunning;
}

// Start monitoring
console.log('Starting difficulty calculation monitor...');
console.log('Will notify when the process completes.');
console.log('Press Ctrl+C to stop monitoring.');

// Set up interval to check status
const monitorInterval = setInterval(async () => {
  const isRunning = await checkStatus();
  if (!isRunning) {
    console.log('Monitor will exit in 5 seconds...');
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  }
}, CHECK_INTERVAL_MS);

// Initial check
checkStatus(); 