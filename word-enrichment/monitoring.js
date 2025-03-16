#!/usr/bin/env node

/**
 * OneWord Enhanced Monitoring Tool
 * Real-time terminal-based dashboard for monitoring word enrichment reprocessing
 * Provides detailed statistics about words being processed, API usage, and progress
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const { spawn } = require('child_process');
const { exec } = require('child_process');

// Initialize Supabase client
const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY
);

// Set up readline interface for capturing keypress events
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

// ANSI colors and styles
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m"
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m"
  }
};

// State and statistics
let refreshRate = 1000; // Refresh rate in milliseconds
let autoRefresh = true;
let isRunning = false;
let logWatcher = null;
let lastRefreshTime = Date.now();
let lastCheckedLogSize = 0;
let runningProcess = null;
let refreshInterval = null;

// Stats tracking
const stats = {
  totalWords: 68760, // Default total words
  processedWords: 0,
  currentBatch: {
    words: [],
    currentIndex: 0,
    size: 0,
    startTime: null
  },
  currentWord: {
    id: null,
    word: 'N/A',
    pos: 'N/A',
    phase: 'N/A'
  },
  apiCalls: {
    total: 0,
    definitions: 0,
    owad: 0,
    distractors: 0,
    keyUsage: {}
  },
  processing: {
    startTime: null,
    batchesProcessed: 0,
    successfulBatches: 0,
    failedBatches: 0,
    batchSize: config.BATCH_SIZE,
    wordsPerMinute: 0,
    estimatedTimeRemaining: 'N/A'
  },
  errors: {
    total: 0,
    rateLimits: 0,
    lastError: null
  },
  recentOutput: []
};

// Initialize key usage stats
config.GEMINI_API_KEYS.forEach(key => {
  const maskedKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
  stats.apiCalls.keyUsage[maskedKey] = {
    requests: 0,
    rateLimits: 0,
    lastUsed: null
  };
});

// Clear the screen
function clearScreen() {
  process.stdout.write('\x1Bc');
}

// Format a number with commas
function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// Format time duration in a human-readable format
function formatDuration(ms) {
  if (!ms || isNaN(ms)) return 'N/A';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Calculate estimated time remaining
function calculateTimeRemaining() {
  if (!stats.processing.startTime || stats.processedWords === 0) {
    return 'N/A';
  }
  
  const elapsedMs = Date.now() - stats.processing.startTime;
  const msPerWord = elapsedMs / stats.processedWords;
  const remainingWords = stats.totalWords - stats.processedWords;
  const estimatedRemainingMs = remainingWords * msPerWord;
  
  return formatDuration(estimatedRemainingMs);
}

// Calculate words per minute processing rate
function calculateWordsPerMinute() {
  if (!stats.processing.startTime || stats.processedWords === 0) {
    return 0;
  }
  
  const elapsedMinutes = (Date.now() - stats.processing.startTime) / 60000;
  return Math.round((stats.processedWords / elapsedMinutes) * 10) / 10;
}

// Draw a progress bar
function drawProgressBar(current, total, width = 50) {
  const percent = Math.min(100, (current / Math.max(1, total)) * 100);
  const filledWidth = Math.round(width * percent / 100);
  const emptyWidth = width - filledWidth;
  
  let barColor = colors.fg.green;
  if (percent < 30) barColor = colors.fg.red;
  else if (percent < 70) barColor = colors.fg.yellow;
  
  const bar = barColor + '█'.repeat(filledWidth) + 
             colors.fg.gray + '█'.repeat(emptyWidth) + 
             colors.reset;
  
  return `${bar} ${colors.bright}${percent.toFixed(1)}%${colors.reset}`;
}

// Draw a header with title
function drawHeader(title) {
  const width = process.stdout.columns || 100;
  const padding = '═'.repeat(Math.floor((width - title.length - 2) / 2));
  return `${colors.fg.cyan}${padding} ${colors.bright}${title}${colors.reset}${colors.fg.cyan} ${padding}${colors.reset}`;
}

// Draw a section header
function drawSectionHeader(title) {
  const width = process.stdout.columns || 100;
  const padding = '═'.repeat(Math.floor((width - title.length - 2) / 2));
  return `${colors.fg.yellow}${padding} ${colors.bright}${title}${colors.reset}${colors.fg.yellow} ${padding}${colors.reset}`;
}

// Draw a separator line
function drawSeparator(char = '─') {
  const width = process.stdout.columns || 100;
  return char.repeat(width);
}

// Get running process info
function getRunningProcessInfo(callback) {
  exec('ps aux | grep "node word-enrichment/reprocess-all.js" | grep -v grep', (error, stdout, stderr) => {
    if (error) {
      isRunning = false;
      callback();
      return;
    }
    
    if (stdout.trim()) {
      isRunning = true;
    } else {
      isRunning = false;
    }
    
    callback();
  });
}

// Parse the log file to update statistics
function parseLogFile() {
  try {
    const logPath = path.join(config.LOG_DIR, 'enrichment.log');
    
    if (!fs.existsSync(logPath)) {
      return;
    }
    
    const stats = fs.statSync(logPath);
    if (stats.size === lastCheckedLogSize) {
      return; // No changes to log file
    }
    
    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n').slice(-1000); // Get last 1000 lines for efficiency
    
    // Update stats based on log content
    updateStatsFromLogs(lines);
    
    // Track log size to avoid re-processing the same content
    lastCheckedLogSize = stats.size;
  } catch (error) {
    console.error('Error parsing log file:', error.message);
  }
}

// Update statistics based on log lines
function updateStatsFromLogs(lines) {
  let currentBatchWords = [];
  let batchStarted = false;
  
  // Process lines in reverse to get the most recent info first
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    
    // Add to recent output for display
    if (stats.recentOutput.length < 10 && line.trim()) {
      stats.recentOutput.unshift(line);
    }
    
    // Progress information
    const progressMatch = line.match(/Progress: (\d+)\/(\d+) \(([0-9.]+)%\)/);
    if (progressMatch) {
      stats.processedWords = parseInt(progressMatch[1], 10);
      stats.totalWords = parseInt(progressMatch[2], 10);
      continue;
    }
    
    // Current batch information
    const batchMatch = line.match(/Processing batch with words: (.*?)(?:, and (\d+) more)?$/);
    if (batchMatch) {
      if (!batchStarted) {
        batchStarted = true;
        currentBatchWords = batchMatch[1].split(', ').map(wordInfo => {
          const [word, pos] = wordInfo.match(/([a-zA-Z0-9_-]+) \(([a-z]+)\)/).slice(1);
          return { word, pos };
        });
        
        if (batchMatch[2]) {
          const additionalCount = parseInt(batchMatch[2], 10);
          stats.currentBatch.size = currentBatchWords.length + additionalCount;
        } else {
          stats.currentBatch.size = currentBatchWords.length;
        }
        
        stats.currentBatch.words = currentBatchWords;
        stats.currentBatch.startTime = new Date();
        stats.processing.batchesProcessed++;
      }
      continue;
    }
    
    // API requests
    const apiRequestMatch = line.match(/API Request successful using key ([A-Za-z0-9]{6}\.{3}[A-Za-z0-9]{4})/);
    if (apiRequestMatch) {
      stats.apiCalls.total++;
      const keyId = apiRequestMatch[1];
      
      if (stats.apiCalls.keyUsage[keyId]) {
        stats.apiCalls.keyUsage[keyId].requests++;
        stats.apiCalls.keyUsage[keyId].lastUsed = new Date();
      }
      
      // Track the type of request
      if (line.includes('Generating definitions')) {
        stats.apiCalls.definitions++;
        stats.currentWord.phase = 'Definitions';
      } else if (line.includes('Generating OWAD phrases')) {
        stats.apiCalls.owad++;
        stats.currentWord.phase = 'OWAD Phrases';
      } else if (line.includes('Generating distractors')) {
        stats.apiCalls.distractors++;
        stats.currentWord.phase = 'Distractors';
      }
      
      continue;
    }
    
    // Rate limits
    if (line.includes('Rate limit exceeded')) {
      stats.errors.rateLimits++;
      const rateLimitKeyMatch = line.match(/Rate limit exceeded for key ([A-Za-z0-9]{6}\.{3}[A-Za-z0-9]{4})/);
      
      if (rateLimitKeyMatch) {
        const keyId = rateLimitKeyMatch[1];
        if (stats.apiCalls.keyUsage[keyId]) {
          stats.apiCalls.keyUsage[keyId].rateLimits++;
        }
      }
      
      continue;
    }
    
    // Errors
    if (line.includes('[ERROR]')) {
      stats.errors.total++;
      stats.errors.lastError = line;
      continue;
    }
    
    // Start time
    if (line.includes('Starting Word Enrichment Tool')) {
      if (!stats.processing.startTime) {
        // Extract timestamp from the log line
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
        if (timestampMatch) {
          stats.processing.startTime = new Date(timestampMatch[1]);
        } else {
          stats.processing.startTime = new Date();
        }
      }
      break; // No need to process older lines once we've found the start
    }
  }
  
  // Update processing rate and time remaining
  stats.processing.wordsPerMinute = calculateWordsPerMinute();
  stats.processing.estimatedTimeRemaining = calculateTimeRemaining();
}

// Render the dashboard
function renderDashboard() {
  clearScreen();
  
  // Update title and status
  console.log(drawHeader('ONEWORD ENRICHMENT MONITORING TOOL'));
  
  console.log(`${colors.bright}Status:${colors.reset} ${isRunning ? colors.fg.green + 'RUNNING' + colors.reset : colors.fg.red + 'STOPPED' + colors.reset}`);
  console.log(`${colors.bright}Controls:${colors.reset} ${colors.fg.cyan}[r]${colors.reset} Refresh  ${colors.fg.cyan}[a]${colors.reset} Toggle Auto-refresh (${autoRefresh ? 'ON' : 'OFF'})  ${colors.fg.cyan}[+/-]${colors.reset} Refresh Rate (${refreshRate}ms)  ${colors.fg.cyan}[q]${colors.reset} Quit`);
  
  console.log(drawSeparator());
  
  // Progress section
  console.log(drawSectionHeader('PROGRESS'));
  
  const progressPercent = (stats.processedWords / stats.totalWords) * 100;
  console.log(`${colors.bright}Processed:${colors.reset} ${formatNumber(stats.processedWords)} / ${formatNumber(stats.totalWords)} words (${progressPercent.toFixed(1)}%)`);
  console.log(`${colors.bright}Progress:${colors.reset} ${drawProgressBar(stats.processedWords, stats.totalWords)}`);
  
  const elapsedTime = stats.processing.startTime ? formatDuration(Date.now() - stats.processing.startTime) : 'N/A';
  console.log(`${colors.bright}Processing Rate:${colors.reset} ${stats.processing.wordsPerMinute.toFixed(1)} words/minute`);
  console.log(`${colors.bright}Elapsed Time:${colors.reset} ${elapsedTime}`);
  console.log(`${colors.bright}Estimated Time Remaining:${colors.reset} ${stats.processing.estimatedTimeRemaining}`);
  console.log(`${colors.bright}Batches Processed:${colors.reset} ${stats.processing.batchesProcessed} (Size: ${stats.currentBatch.size})`);
  
  // Current batch processing
  console.log(drawSectionHeader('CURRENT BATCH'));
  
  if (stats.currentBatch.words.length > 0) {
    const displayWords = stats.currentBatch.words.slice(0, 5);
    console.log(`${colors.bright}Words in Batch:${colors.reset} ${displayWords.map(w => `${colors.fg.green}${w.word}${colors.reset} (${w.pos})`).join(', ')}${stats.currentBatch.words.length > 5 ? `, and ${stats.currentBatch.words.length - 5} more` : ''}`);
    console.log(`${colors.bright}Current Phase:${colors.reset} ${colors.fg.yellow}${stats.currentWord.phase}${colors.reset}`);
    
    if (stats.currentBatch.startTime) {
      const batchElapsed = formatDuration(Date.now() - stats.currentBatch.startTime);
      console.log(`${colors.bright}Batch Processing Time:${colors.reset} ${batchElapsed}`);
    }
  } else {
    console.log(`${colors.fg.yellow}No current batch information available${colors.reset}`);
  }
  
  // API usage section
  console.log(drawSectionHeader('API USAGE'));
  
  console.log(`${colors.bright}Total API Calls:${colors.reset} ${formatNumber(stats.apiCalls.total)}`);
  console.log(`${colors.bright}Definition Requests:${colors.reset} ${formatNumber(stats.apiCalls.definitions)}`);
  console.log(`${colors.bright}OWAD Phrase Requests:${colors.reset} ${formatNumber(stats.apiCalls.owad)}`);
  console.log(`${colors.bright}Distractor Requests:${colors.reset} ${formatNumber(stats.apiCalls.distractors)}`);
  console.log(`${colors.bright}Errors:${colors.reset} ${formatNumber(stats.errors.total)}  ${colors.bright}Rate Limits:${colors.reset} ${formatNumber(stats.errors.rateLimits)}`);
  
  // API key usage table
  console.log(`\n${colors.bright}API Key Usage:${colors.reset}`);
  console.log(drawSeparator('─'));
  console.log(`${colors.bright}Key               Requests    Rate Limits    Last Used${colors.reset}`);
  console.log(drawSeparator('─'));
  
  Object.entries(stats.apiCalls.keyUsage).forEach(([key, stats]) => {
    const lastUsed = stats.lastUsed ? new Date(stats.lastUsed).toLocaleTimeString() : 'Never';
    console.log(`${colors.fg.cyan}${key}${colors.reset}      ${stats.requests.toString().padEnd(8)}    ${stats.rateLimits.toString().padEnd(10)}    ${lastUsed}`);
  });
  
  // Recent output
  console.log(drawSectionHeader('RECENT OUTPUT'));
  
  if (stats.recentOutput.length > 0) {
    stats.recentOutput.slice(0, 10).forEach(line => {
      // Colorize output based on log level
      let coloredLine = line;
      if (line.includes('[INFO]')) {
        coloredLine = line.replace('[INFO]', `${colors.fg.cyan}[INFO]${colors.reset}`);
      } else if (line.includes('[ERROR]')) {
        coloredLine = line.replace('[ERROR]', `${colors.fg.red}[ERROR]${colors.reset}`);
      } else if (line.includes('[WARN]')) {
        coloredLine = line.replace('[WARN]', `${colors.fg.yellow}[WARN]${colors.reset}`);
      } else if (line.includes('[SUCCESS]')) {
        coloredLine = line.replace('[SUCCESS]', `${colors.fg.green}[SUCCESS]${colors.reset}`);
      }
      
      console.log(coloredLine);
    });
  } else {
    console.log(`${colors.fg.yellow}No recent output available${colors.reset}`);
  }
  
  console.log(drawSeparator('═'));
}

// Start monitoring
function startMonitoring() {
  // Initial render
  getRunningProcessInfo(() => {
    parseLogFile();
    renderDashboard();
    
    // Set up interval for auto-refresh
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
      if (autoRefresh) {
        getRunningProcessInfo(() => {
          parseLogFile();
          renderDashboard();
        });
      }
    }, refreshRate);
    
    // Set up key press handler
    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        process.exit();
      } else if (key.name === 'q') {
        cleanup();
        process.exit();
      } else if (key.name === 'r') {
        getRunningProcessInfo(() => {
          parseLogFile();
          renderDashboard();
        });
      } else if (key.name === 'a') {
        autoRefresh = !autoRefresh;
        renderDashboard();
      } else if (key.name === '+' || key.name === '=') {
        refreshRate = Math.max(500, refreshRate - 500);
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = setInterval(() => {
            if (autoRefresh) {
              getRunningProcessInfo(() => {
                parseLogFile();
                renderDashboard();
              });
            }
          }, refreshRate);
        }
        renderDashboard();
      } else if (key.name === '-') {
        refreshRate = Math.min(10000, refreshRate + 500);
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = setInterval(() => {
            if (autoRefresh) {
              getRunningProcessInfo(() => {
                parseLogFile();
                renderDashboard();
              });
            }
          }, refreshRate);
        }
        renderDashboard();
      }
    });
  });
}

// Clean up resources
function cleanup() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  cleanup();
  process.exit();
});

// Start the monitoring tool
startMonitoring(); 