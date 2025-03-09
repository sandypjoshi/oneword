/**
 * Enrichment Process Monitor
 * 
 * This script provides a real-time dashboard view of the enrichment process.
 * It continuously reads the state and log files to show live progress.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const STATE_FILE = path.join(__dirname, 'enrichment-state.json');
const LOG_FILE = path.join(__dirname, 'datamuse-enrichment.log');
const UPDATE_INTERVAL_MS = 1000; // Update every second

// ANSI color codes for prettier output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// State variables
let state = {};
let recentLogs = [];
const MAX_RECENT_LOGS = 10;
let processRunning = false;
let recentWordIds = new Set();
let recentWords = [];
const MAX_RECENT_WORDS = 5;
let errorCount = 0;
let lastUpdate = new Date();
let startTime = new Date();
let processedPerMinute = 0;

/**
 * Clear the terminal screen
 */
function clearScreen() {
  process.stdout.write('\x1b[2J');
  process.stdout.write('\x1b[0f');
}

/**
 * Format a number with commas
 */
function formatNumber(num) {
  return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
}

/**
 * Format a date as a string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Calculate time elapsed in a human-readable format
 */
function calculateTimeElapsed(startDate) {
  if (!startDate) return 'N/A';
  
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now - start;
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  
  const hours = diffHours;
  const mins = diffMins % 60;
  const secs = diffSecs % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if the enrichment process is running
 */
function checkProcessRunning() {
  try {
    const command = process.platform === 'win32' 
      ? 'tasklist | findstr "node datamuse-enricher.js"'
      : 'ps aux | grep "[n]ode datamuse-enricher.js"';
    
    const output = require('child_process').execSync(command, { encoding: 'utf8' });
    processRunning = output.trim().length > 0;
  } catch (error) {
    processRunning = false;
  }
}

/**
 * Load the current state from the state file
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const stateData = fs.readFileSync(STATE_FILE, 'utf8');
      state = JSON.parse(stateData);
      lastUpdate = new Date();
    } else {
      state = {};
    }
  } catch (error) {
    console.error(`Error loading state: ${error.message}`);
  }
}

/**
 * Check for recent log entries
 */
function checkRecentLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      // Get the last few lines from the log file
      const logData = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = logData.split('\n').filter(line => line.trim());
      
      // Get the most recent lines
      recentLogs = lines.slice(-MAX_RECENT_LOGS);
      
      // Count errors
      errorCount = lines.filter(line => line.includes('ERROR')).length;
      
      // Extract recent words processed
      const wordLines = lines.slice(-100).filter(line => 
        line.includes('"word":') && 
        line.includes('"success":true') && 
        line.includes('"frequency":')
      );
      
      for (const line of wordLines) {
        try {
          // Extract word details from JSON in the log
          const match = line.match(/"wordId":(\d+),"word":"([^"]+)"/);
          if (match) {
            const [, id, word] = match;
            if (!recentWordIds.has(parseInt(id))) {
              recentWordIds.add(parseInt(id));
              recentWords.unshift({ id, word });
              
              // Keep only the most recent words
              if (recentWords.length > MAX_RECENT_WORDS) {
                recentWords.pop();
              }
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  } catch (error) {
    console.error(`Error checking logs: ${error.message}`);
  }
}

/**
 * Calculate processing rate
 */
function calculateProcessingRate() {
  if (state.totalProcessed && state.processingStartTime) {
    const start = new Date(state.processingStartTime);
    const now = new Date();
    const minutesElapsed = Math.max(1, (now - start) / (1000 * 60));
    processedPerMinute = Math.round(state.totalProcessed / minutesElapsed);
  }
}

/**
 * Render the dashboard
 */
function renderDashboard() {
  clearScreen();
  
  // Title
  console.log(`${COLORS.bright}${COLORS.cyan}===== WORD ENRICHMENT DASHBOARD =====${COLORS.reset}`);
  console.log(`${COLORS.dim}Last Updated: ${new Date().toLocaleString()}${COLORS.reset}\n`);
  
  // Process status
  const statusColor = processRunning ? COLORS.green : COLORS.red;
  const statusText = processRunning ? 'RUNNING' : 'STOPPED';
  console.log(`${COLORS.bright}Process Status:${COLORS.reset} ${statusColor}${statusText}${COLORS.reset}`);
  
  // Basic stats section
  console.log(`\n${COLORS.bright}${COLORS.yellow}=== Processing Statistics ===${COLORS.reset}`);
  console.log(`${COLORS.bright}Current Word ID:${COLORS.reset} ${state.startId || 'N/A'}`);
  console.log(`${COLORS.bright}Total Processed:${COLORS.reset} ${formatNumber(state.totalProcessed)}`);
  console.log(`${COLORS.bright}Total Successful:${COLORS.reset} ${COLORS.green}${formatNumber(state.totalSuccessful)}${COLORS.reset}`);
  console.log(`${COLORS.bright}Total Failed:${COLORS.reset} ${COLORS.red}${formatNumber(state.totalFailed)}${COLORS.reset}`);
  console.log(`${COLORS.bright}Total Skipped:${COLORS.reset} ${COLORS.yellow}${formatNumber(state.totalSkipped)}${COLORS.reset}`);
  console.log(`${COLORS.bright}Total Errors:${COLORS.reset} ${COLORS.red}${formatNumber(errorCount)}${COLORS.reset}`);
  
  // Eligibility stats
  console.log(`${COLORS.bright}Marked Eligible:${COLORS.reset} ${formatNumber(state.totalMarkedEligible)}`);
  console.log(`${COLORS.bright}Marked Ineligible:${COLORS.reset} ${formatNumber(state.totalMarkedIneligible)}`);
  
  // API usage
  console.log(`${COLORS.bright}API Requests Today:${COLORS.reset} ${formatNumber(state.dailyRequestCount)}/100,000`);
  
  // Time stats
  console.log(`\n${COLORS.bright}${COLORS.yellow}=== Timing Information ===${COLORS.reset}`);
  console.log(`${COLORS.bright}Processing Started:${COLORS.reset} ${formatDate(state.processingStartTime)}`);
  console.log(`${COLORS.bright}Last State Update:${COLORS.reset} ${formatDate(state.lastUpdated)}`);
  console.log(`${COLORS.bright}Time Elapsed:${COLORS.reset} ${calculateTimeElapsed(state.processingStartTime)}`);
  console.log(`${COLORS.bright}Processing Rate:${COLORS.reset} ~${formatNumber(processedPerMinute)} words/minute`);
  
  // Recent words section
  console.log(`\n${COLORS.bright}${COLORS.yellow}=== Recently Processed Words ===${COLORS.reset}`);
  if (recentWords.length === 0) {
    console.log(`${COLORS.dim}No recently processed words${COLORS.reset}`);
  } else {
    recentWords.forEach(({ id, word }) => {
      console.log(`${COLORS.bright}ID ${id}:${COLORS.reset} ${word}`);
    });
  }
  
  // Recent logs section
  console.log(`\n${COLORS.bright}${COLORS.yellow}=== Recent Log Activity ===${COLORS.reset}`);
  if (recentLogs.length === 0) {
    console.log(`${COLORS.dim}No recent log entries${COLORS.reset}`);
  } else {
    recentLogs.forEach(log => {
      const isError = log.includes('ERROR');
      const color = isError ? COLORS.red : COLORS.reset;
      console.log(`${color}${log}${COLORS.reset}`);
    });
  }
  
  // Footer
  console.log(`\n${COLORS.dim}Press Ctrl+C to exit this dashboard${COLORS.reset}`);
}

/**
 * Main function to update the dashboard
 */
function updateDashboard() {
  checkProcessRunning();
  loadState();
  checkRecentLogs();
  calculateProcessingRate();
  renderDashboard();
}

/**
 * Start the monitoring
 */
function startMonitoring() {
  console.log('Starting enrichment monitoring...');
  startTime = new Date();
  
  // Initial update
  updateDashboard();
  
  // Set up interval to update regularly
  const interval = setInterval(updateDashboard, UPDATE_INTERVAL_MS);
  
  // Handle exit
  process.on('SIGINT', () => {
    clearInterval(interval);
    clearScreen();
    console.log('Monitoring stopped.');
    process.exit();
  });
}

// Start the monitoring
startMonitoring(); 