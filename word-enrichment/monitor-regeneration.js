#!/usr/bin/env node

/**
 * OneWord Regeneration Process Monitor
 * Terminal-based dashboard to monitor the regeneration process
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('./config');
const { execSync, exec } = require('child_process');

// Set up readline
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

// Stats tracking
const stats = {
  processRunning: false,
  lastLogLine: "",
  progress: {
    processed: 0,
    total: 0,
    percentage: 0
  },
  performance: {
    wordsPerMinute: 0,
    timeRemaining: "Unknown",
    successRate: "100%"
  },
  apiCalls: 0,
  apiCallsPerWord: 0,
  startTime: null,
  lastUpdate: null,
  keyUsage: new Map(),
  errors: {
    total: 0,
    byType: {}
  },
  logs: [],
  maxLogLines: 15,
  currentBatch: []
};

// Check if process is running
function checkProcessRunning() {
  try {
    // Get process list and grep for regenerate-all.js
    const result = execSync('ps aux | grep "[r]egenerate-all.js"').toString();
    const lines = result.split('\n').filter(line => line.trim() !== '');
    
    stats.processRunning = lines.length > 0;
    if (stats.processRunning && !stats.startTime) {
      // If process is running but we haven't recorded start time
      stats.startTime = new Date();
    }
    
    return stats.processRunning;
  } catch (error) {
    stats.processRunning = false;
    return false;
  }
}

// Parse log file to extract stats
function parseLogFile() {
  try {
    // Find the latest log file
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) return;
    
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.startsWith('enrichment'))
      .map(file => ({
        name: file,
        path: path.join(logDir, file),
        time: fs.statSync(path.join(logDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (logFiles.length === 0) return;
    
    const latestLog = logFiles[0];
    const logContent = fs.readFileSync(latestLog.path, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim() !== '');
    
    // Only process new lines since last update
    const lastProcessedLine = stats.lastLogLine;
    const newLines = lastProcessedLine ? 
      lines.slice(lines.findIndex(line => line === lastProcessedLine) + 1) : 
      lines;
    
    if (newLines.length === 0) return;
    
    // Update last log line
    stats.lastLogLine = lines[lines.length - 1];
    
    // Add new lines to logs array
    newLines.forEach(line => {
      stats.logs.push(line);
      if (stats.logs.length > stats.maxLogLines) {
        stats.logs.shift();
      }
    });
    
    // Parse progress information
    const progressLines = newLines.filter(line => line.includes('Progress:'));
    if (progressLines.length > 0) {
      const latestProgress = progressLines[progressLines.length - 1];
      const progressMatch = latestProgress.match(/Progress: (\d+)\/(\d+) words \(([0-9.]+)%\)/);
      
      if (progressMatch) {
        stats.progress.processed = parseInt(progressMatch[1], 10);
        stats.progress.total = parseInt(progressMatch[2], 10);
        stats.progress.percentage = parseFloat(progressMatch[3]);
      }
    }
    
    // Parse performance information
    const performanceLines = newLines.filter(line => line.includes('Performance:'));
    if (performanceLines.length > 0) {
      const latestPerformance = performanceLines[performanceLines.length - 1];
      
      const wpmMatch = latestPerformance.match(/Performance: ([0-9.]+) words\/minute/);
      if (wpmMatch) {
        stats.performance.wordsPerMinute = parseFloat(wpmMatch[1]);
      }
      
      const successRateLines = newLines.filter(line => line.includes('Success rate:'));
      if (successRateLines.length > 0) {
        const latestSuccessRate = successRateLines[successRateLines.length - 1];
        const successRateMatch = latestSuccessRate.match(/Success rate: ([0-9.]+%)/);
        if (successRateMatch) {
          stats.performance.successRate = successRateMatch[1];
        }
      }
      
      const timeLines = newLines.filter(line => line.includes('Estimated time remaining:'));
      if (timeLines.length > 0) {
        const latestTimeLine = timeLines[timeLines.length - 1];
        const timeMatch = latestTimeLine.match(/Estimated time remaining: ([0-9]+h [0-9]+m)/);
        if (timeMatch) {
          stats.performance.timeRemaining = timeMatch[1];
        }
      }
    }
    
    // Parse API calls
    const apiLines = newLines.filter(line => line.includes('API calls:'));
    if (apiLines.length > 0) {
      const latestApiLine = apiLines[apiLines.length - 1];
      const apiMatch = latestApiLine.match(/API calls: (\d+) \(([0-9.]+) per word\)/);
      if (apiMatch) {
        stats.apiCalls = parseInt(apiMatch[1], 10);
        stats.apiCallsPerWord = parseFloat(apiMatch[2]);
      }
    }
    
    // Parse key usage
    const keyLines = newLines.filter(line => line.includes('Key ') && line.includes('requests'));
    keyLines.forEach(line => {
      const keyMatch = line.match(/Key (.+): (\d+) requests, (\d+) errors/);
      if (keyMatch) {
        const key = keyMatch[1];
        const requests = parseInt(keyMatch[2], 10);
        const errors = parseInt(keyMatch[3], 10);
        
        stats.keyUsage.set(key, {
          requests,
          errors
        });
      }
    });
    
    // Parse current batch
    const batchLines = newLines.filter(line => line.includes('Processing batch with words:'));
    if (batchLines.length > 0) {
      const latestBatch = batchLines[batchLines.length - 1];
      const batchMatch = latestBatch.match(/Processing batch with words: (.+)$/);
      if (batchMatch) {
        const batchInfo = batchMatch[1];
        stats.currentBatch = batchInfo.split(', and ')[0].split(', ');
      }
    }
    
    // Parse errors
    const errorLines = newLines.filter(line => line.includes('[ERROR]'));
    stats.errors.total += errorLines.length;
    
    errorLines.forEach(line => {
      let errorType = 'Other';
      
      if (line.includes('rate limit')) errorType = 'Rate Limit';
      else if (line.includes('timeout')) errorType = 'Timeout';
      else if (line.includes('parsing')) errorType = 'Parsing';
      
      stats.errors.byType[errorType] = (stats.errors.byType[errorType] || 0) + 1;
    });
    
    stats.lastUpdate = new Date();
  } catch (error) {
    console.error(`Error parsing logs: ${error.message}`);
  }
}

// Render dashboard
function renderDashboard() {
  // Clear screen
  console.clear();
  
  // Calculate runtime
  let runtimeStr = 'Not started';
  if (stats.startTime) {
    const runtime = Math.floor((Date.now() - stats.startTime) / 1000);
    const hours = Math.floor(runtime / 3600);
    const minutes = Math.floor((runtime % 3600) / 60);
    const seconds = runtime % 60;
    runtimeStr = `${hours}h ${minutes}m ${seconds}s`;
  }
  
  // Header
  console.log(colors.bg.blue + colors.fg.white + ' '.repeat(process.stdout.columns) + colors.reset);
  const title = 'ONEWORD REGENERATION MONITOR';
  const paddedTitle = ' '.repeat(Math.floor((process.stdout.columns - title.length) / 2)) + title;
  console.log(colors.bg.blue + colors.fg.white + paddedTitle + ' '.repeat(process.stdout.columns - paddedTitle.length) + colors.reset);
  console.log(colors.bg.blue + colors.fg.white + ' '.repeat(process.stdout.columns) + colors.reset);
  
  // Process status
  const statusText = stats.processRunning ? 
    colors.fg.green + 'RUNNING' + colors.reset : 
    colors.fg.red + 'STOPPED' + colors.reset;
  
  console.log(`${colors.bright}Status:${colors.reset} ${statusText} | ${colors.bright}Runtime:${colors.reset} ${runtimeStr} | ${colors.bright}Last Updated:${colors.reset} ${stats.lastUpdate ? stats.lastUpdate.toLocaleTimeString() : 'Never'}`);
  
  // Progress section
  console.log('\n' + colors.bg.cyan + colors.fg.black + ' PROGRESS ' + ' '.repeat(process.stdout.columns - 10) + colors.reset);
  const progressBar = createProgressBar(stats.progress.percentage, process.stdout.columns - 10);
  console.log(`${progressBar} ${stats.progress.percentage.toFixed(2)}%`);
  console.log(`${colors.bright}Words Processed:${colors.reset} ${stats.progress.processed.toLocaleString()} / ${stats.progress.total.toLocaleString()}`);
  console.log(`${colors.bright}Performance:${colors.reset} ${stats.performance.wordsPerMinute} words/minute | ${colors.bright}Success Rate:${colors.reset} ${stats.performance.successRate}`);
  console.log(`${colors.bright}Estimated Time Remaining:${colors.reset} ${stats.performance.timeRemaining}`);
  
  // Batch info
  console.log('\n' + colors.bg.yellow + colors.fg.black + ' CURRENT BATCH ' + ' '.repeat(process.stdout.columns - 14) + colors.reset);
  if (stats.currentBatch.length > 0) {
    stats.currentBatch.forEach(word => {
      console.log(`• ${word}`);
    });
  } else {
    console.log('No batch information available');
  }
  
  // API usage
  console.log('\n' + colors.bg.magenta + colors.fg.white + ' API USAGE ' + ' '.repeat(process.stdout.columns - 11) + colors.reset);
  console.log(`${colors.bright}Total API Calls:${colors.reset} ${stats.apiCalls.toLocaleString()} (${stats.apiCallsPerWord} per word)`);
  
  // Key usage table
  console.log(`\n${colors.bright}Key Usage:${colors.reset}`);
  console.log('-'.repeat(process.stdout.columns - 10));
  console.log(`${colors.bright}Key               Requests    Errors${colors.reset}`);
  console.log('-'.repeat(process.stdout.columns - 10));
  
  if (stats.keyUsage.size > 0) {
    for (const [key, usage] of stats.keyUsage.entries()) {
      console.log(`${colors.fg.cyan}${key.padEnd(18)}${colors.reset} ${usage.requests.toString().padEnd(12)} ${usage.errors}`);
    }
  } else {
    console.log('No key usage data available yet');
  }
  
  // Error information
  console.log('\n' + colors.bg.red + colors.fg.white + ' ERRORS ' + ' '.repeat(process.stdout.columns - 8) + colors.reset);
  console.log(`${colors.bright}Total Errors:${colors.reset} ${stats.errors.total}`);
  
  if (Object.keys(stats.errors.byType).length > 0) {
    console.log(`${colors.bright}Error Types:${colors.reset}`);
    for (const [type, count] of Object.entries(stats.errors.byType)) {
      console.log(`• ${type}: ${count}`);
    }
  }
  
  // Recent log output
  console.log('\n' + colors.bg.green + colors.fg.black + ' LOG OUTPUT ' + ' '.repeat(process.stdout.columns - 12) + colors.reset);
  if (stats.logs.length > 0) {
    stats.logs.slice(-10).forEach(log => {
      // Color-code log levels
      if (log.includes('[ERROR]')) {
        console.log(colors.fg.red + log + colors.reset);
      } else if (log.includes('[SUCCESS]')) {
        console.log(colors.fg.green + log + colors.reset);
      } else if (log.includes('[INFO]')) {
        console.log(log);
      } else {
        console.log(log);
      }
    });
  } else {
    console.log('No log output available yet');
  }
  
  // Help
  console.log('\n' + '-'.repeat(process.stdout.columns));
  console.log(`Press ${colors.bright}Q${colors.reset} to quit | ${colors.bright}R${colors.reset} to refresh | ${colors.bright}C${colors.reset} to clear errors`);
}

// Create a progress bar
function createProgressBar(percentage, width) {
  const barWidth = width - 7; // Account for the percentage display
  const filledWidth = Math.floor(barWidth * (percentage / 100));
  const emptyWidth = barWidth - filledWidth;
  
  return `[${colors.fg.green}${'█'.repeat(filledWidth)}${colors.reset}${'▒'.repeat(emptyWidth)}]`;
}

// Main function
async function main() {
  // Initial process check
  checkProcessRunning();
  parseLogFile();
  renderDashboard();
  
  // Set up keypress handler
  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      // Quit
      process.exit(0);
    } else if (key.name === 'r') {
      // Refresh
      checkProcessRunning();
      parseLogFile();
      renderDashboard();
    } else if (key.name === 'c') {
      // Clear errors
      stats.errors.total = 0;
      stats.errors.byType = {};
      renderDashboard();
    }
  });
  
  // Update loop
  setInterval(() => {
    checkProcessRunning();
    parseLogFile();
    renderDashboard();
  }, 1000); // Update every second
}

// Start the dashboard
main().catch(error => {
  console.error(`Error in dashboard: ${error.message}`);
  process.exit(1);
}); 