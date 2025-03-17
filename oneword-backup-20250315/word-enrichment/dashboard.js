#!/usr/bin/env node

/**
 * OneWord Enrichment Dashboard
 * Simple terminal-based dashboard for monitoring and controlling the word enrichment process
 * No external UI libraries - just uses standard terminal output with ANSI colors
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./db');
const readline = require('readline');

// Create a readline interface for capturing keypress events
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Process state
let isRunning = false;
let processInstance = null;
let processStartTime = null;
let lastRefreshTime = Date.now();
let autoRefresh = true;

// Stats
const stats = {
  totalWords: 0,
  remainingWords: 0,
  processedWords: 0,
  currentOffset: 0,
  apiCalls: 0,
  errors: 0,
  rateLimitHits: 0,
  lastUpdated: new Date(),
  lastWordProcessed: {
    id: 0,
    word: 'N/A',
    pos: 'N/A'
  },
  keyStats: {},
  outputBuffer: [],
  maxOutputLines: 15,
  reprocessing: {
    definitionsUpdated: 0,
    owadPhrasesUpdated: 0,
    distractorsUpdated: 0,
    currentBatch: 0,
    batches: [],
    errors: 0,
    errorWords: []
  }
};

// ANSI colors for prettier console output
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
    white: "\x1b[37m"
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

// Initialize key stats
function initializeKeyStats() {
  config.GEMINI_API_KEYS.forEach(key => {
    // Apply the same masking format as in GeminiClient: first 6 chars + ... + last 4 chars
    const maskedKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
    stats.keyStats[maskedKey] = {
      requests: 0,
      rateLimits: 0,
      lastUsed: null
    };
  });
}

// Mask API key for display
function maskApiKey(key) {
  if (!key) return 'unknown';
  return key.substring(0, 6) + '...' + key.substring(key.length - 4);
}

// Clear the terminal
function clearTerminal() {
  process.stdout.write('\x1Bc');
}

// Draw a horizontal line
function drawLine(char = '─', width = process.stdout.columns || 80) {
  return char.repeat(width);
}

// Create a centered title with padding
function centerTitle(title, width = process.stdout.columns || 80, char = '═') {
  const titleText = ` ${title} `;
  const padLength = Math.floor((width - titleText.length) / 2);
  const padding = char.repeat(padLength);
  return padding + titleText + padding + (titleText.length % 2 ? char : '');
}

// Draw a progress bar
function drawProgressBar(current, total, width = 40) {
  const percent = Math.min(100, (current / Math.max(1, total)) * 100);
  const filledWidth = Math.round(width * percent / 100);
  const emptyWidth = width - filledWidth;
  
  const bar = colors.fg.green + '█'.repeat(filledWidth) + 
              colors.fg.black + '█'.repeat(emptyWidth) + 
              colors.reset;
  
  return `${bar} ${colors.bright}${percent.toFixed(1)}%${colors.reset}`;
}

// Format time (ms) as human-readable string
function formatTime(ms) {
  if (!ms) return 'N/A';
  
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

// Calculate time estimates
function calculateTimeEstimates() {
  if (!processStartTime || stats.processedWords === 0) {
    return { elapsed: 'N/A', remaining: 'N/A', rate: 0 };
  }
  
  const elapsed = Date.now() - processStartTime;
  const elapsedMinutes = elapsed / 60000;
  const processingRate = stats.processedWords / elapsedMinutes; // words per minute
  
  const remainingWords = stats.remainingWords;
  const estimatedTimeRemaining = remainingWords / processingRate * 60000;
  
  return {
    elapsed: formatTime(elapsed),
    remaining: formatTime(estimatedTimeRemaining),
    rate: processingRate
  };
}

// Render the dashboard
function renderDashboard() {
  clearTerminal();
  
  // Header
  console.log(colors.bg.blue + colors.fg.white + centerTitle('ONEWORD ENRICHMENT DASHBOARD', process.stdout.columns) + colors.reset);
  console.log('');
  
  // Status and controls
  const statusColor = isRunning ? colors.fg.green : colors.fg.red;
  console.log(`${colors.bright}Status:${colors.reset} ${statusColor}${isRunning ? 'RUNNING' : 'STOPPED'}${colors.reset}`);
  console.log(`${colors.bright}Controls:${colors.reset} [${colors.fg.green}s${colors.reset}] Start/Stop  [${colors.fg.yellow}r${colors.reset}] Restart  [${colors.fg.cyan}a${colors.reset}] Toggle Auto-refresh  [${colors.fg.red}q${colors.reset}] Quit`);
  
  console.log('');
  console.log(drawLine());
  console.log('');
  
  // Progress section
  console.log(colors.bg.cyan + colors.fg.black + centerTitle('PROGRESS', process.stdout.columns / 2) + colors.reset);
  
  const timeEstimates = calculateTimeEstimates();
  const completedPercent = (stats.processedWords / (stats.remainingWords + stats.processedWords)) * 100;
  
  console.log(`${colors.bright}Processed:${colors.reset} ${stats.processedWords} / ${stats.remainingWords + stats.processedWords} words`);
  console.log(`${colors.bright}Progress:${colors.reset} ${drawProgressBar(stats.processedWords, stats.remainingWords + stats.processedWords)}`);
  console.log(`${colors.bright}Processing Rate:${colors.reset} ${timeEstimates.rate.toFixed(1)} words/minute`);
  console.log(`${colors.bright}Elapsed Time:${colors.reset} ${timeEstimates.elapsed}`);
  console.log(`${colors.bright}Estimated Time Remaining:${colors.reset} ${timeEstimates.remaining}`);
  console.log(`${colors.bright}Last Updated:${colors.reset} ${stats.lastUpdated.toLocaleTimeString()}`);
  
  console.log('');
  
  // Current word section
  console.log(colors.bg.green + colors.fg.black + centerTitle('CURRENT WORD', process.stdout.columns / 2) + colors.reset);
  console.log(`${colors.bright}ID:${colors.reset} ${stats.lastWordProcessed.id}`);
  console.log(`${colors.bright}Word:${colors.reset} ${stats.lastWordProcessed.word}`);
  console.log(`${colors.bright}POS:${colors.reset} ${stats.lastWordProcessed.pos}`);
  
  console.log('');
  console.log(drawLine());
  console.log('');
  
  // Add reprocessing stats section
  console.log(colors.bg.cyan + colors.fg.white + centerTitle('REPROCESSING STATS', process.stdout.columns) + colors.reset);
  console.log(`${colors.bright}Definitions Updated:${colors.reset} ${stats.reprocessing.definitionsUpdated}`);
  console.log(`${colors.bright}OWAD Phrases Updated:${colors.reset} ${stats.reprocessing.owadPhrasesUpdated}`);
  console.log(`${colors.bright}Distractors Updated:${colors.reset} ${stats.reprocessing.distractorsUpdated}`);
  console.log(`${colors.bright}Current Batch:${colors.reset} ${stats.reprocessing.currentBatch}`);
  console.log(`${colors.bright}Errors:${colors.reset} ${stats.reprocessing.errors}`);
  
  // Show latest batch info if available
  if (stats.reprocessing.batches.length > 0) {
    const latestBatch = stats.reprocessing.batches[stats.reprocessing.batches.length - 1];
    console.log('');
    console.log(`${colors.bright}Latest Batch:${colors.reset}`);
    console.log(`  - Words: ${latestBatch.wordCount || 'N/A'}`);
    console.log(`  - Time: ${latestBatch.elapsedTimeMin || 'N/A'} minutes`);
    console.log(`  - Updated: ${latestBatch.definitionsUpdated || 0}/${latestBatch.owadPhrasesUpdated || 0}/${latestBatch.distractorsUpdated || 0}`);
  }
  
  console.log('');
  console.log(drawLine());
  console.log('');
  
  // API Stats section
  console.log(colors.bg.magenta + colors.fg.white + centerTitle('API STATISTICS', process.stdout.columns) + colors.reset);
  console.log(`${colors.bright}Total API Calls:${colors.reset} ${stats.apiCalls}`);
  console.log(`${colors.bright}Errors:${colors.reset} ${stats.errors}`);
  console.log(`${colors.bright}Rate Limit Hits:${colors.reset} ${stats.rateLimitHits}`);
  
  // API key usage table
  console.log('');
  console.log(`${colors.bright}API Key Usage:${colors.reset}`);
  console.log(drawLine('─', process.stdout.columns - 10));
  console.log(`${colors.bright}Key               Requests    Rate Limits    Last Used${colors.reset}`);
  console.log(drawLine('─', process.stdout.columns - 10));
  
  Object.entries(stats.keyStats).forEach(([key, keyStats]) => {
    const lastUsed = keyStats.lastUsed ? keyStats.lastUsed.toLocaleTimeString() : 'Never';
    console.log(`${colors.fg.cyan}${key.padEnd(18)}${colors.reset} ${keyStats.requests.toString().padEnd(12)} ${keyStats.rateLimits.toString().padEnd(14)} ${lastUsed}`);
  });
  
  console.log('');
  console.log(drawLine());
  console.log('');
  
  // Process output
  console.log(colors.bg.yellow + colors.fg.black + centerTitle('PROCESS OUTPUT', process.stdout.columns) + colors.reset);
  if (stats.outputBuffer.length === 0) {
    console.log('No output yet...');
  } else {
    stats.outputBuffer.forEach(line => console.log(line));
  }
  
  console.log('');
  console.log(drawLine('═', process.stdout.columns));
  console.log('');
}

// Add a line to the output buffer
function addOutputLine(line) {
  stats.outputBuffer.push(line);
  
  // Keep buffer at max size
  if (stats.outputBuffer.length > stats.maxOutputLines) {
    stats.outputBuffer.shift();
  }
}

// Parse process output to update statistics
function parseProcessOutput(output) {
  stats.lastUpdated = new Date();
  
  // Add to output buffer
  addOutputLine(output);
  
  // Check for processed count
  const processedMatch = output.match(/Processed (\d+)\/(\d+) words/);
  if (processedMatch && processedMatch[1] && processedMatch[2]) {
    stats.processedWords = parseInt(processedMatch[1], 10);
    stats.remainingWords = parseInt(processedMatch[2], 10) - stats.processedWords;
  }
  
  // Check for current offset
  const offsetMatch = output.match(/Current offset: (\d+)/);
  if (offsetMatch && offsetMatch[1]) {
    stats.currentOffset = parseInt(offsetMatch[1], 10);
  }
  
  // Check for API requests
  const requestMatch = output.match(/API Requests: (\d+)/);
  if (requestMatch && requestMatch[1]) {
    stats.apiCalls = parseInt(requestMatch[1], 10);
  }
  
  // Check for API key usage
  // Match pattern: "using key AIzaSy...ABCD" from GeminiClient's _maskApiKey format
  const keyUsageMatch = output.match(/using key ([A-Za-z0-9]{6}\.{3}[A-Za-z0-9]{4})/);
  if (keyUsageMatch && keyUsageMatch[1]) {
    const keyId = keyUsageMatch[1]; // Already masked in the logs
    
    if (stats.keyStats[keyId]) {
      stats.keyStats[keyId].requests++;
      stats.keyStats[keyId].lastUsed = new Date();
    } else {
      // Add this key if not already tracked
      stats.keyStats[keyId] = {
        requests: 1,
        rateLimits: 0,
        lastUsed: new Date()
      };
    }
  }
  
  // Check for rate limit
  if (output.includes('Rate limit exceeded')) {
    stats.rateLimitHits++;
    
    // Try to extract which key hit the rate limit
    const rateLimitKeyMatch = output.match(/Rate limit exceeded for key ([A-Za-z0-9]{6}\.{3}[A-Za-z0-9]{4})/);
    if (rateLimitKeyMatch && rateLimitKeyMatch[1]) {
      const keyId = rateLimitKeyMatch[1]; // Already masked in the logs
      
      if (stats.keyStats[keyId]) {
        stats.keyStats[keyId].rateLimits++;
      }
    }
  }
  
  // Check for errors
  if (output.includes('[ERROR]')) {
    stats.errors++;
    stats.reprocessing.errors++;
  }
  
  // Check for current word being processed
  const wordInfoMatch = output.match(/Processing word: ([a-zA-Z0-9_-]+) \(([a-z]+)\) \[ID: (\d+)\]/);
  if (wordInfoMatch && wordInfoMatch[1] && wordInfoMatch[2] && wordInfoMatch[3]) {
    stats.lastWordProcessed.word = wordInfoMatch[1];
    stats.lastWordProcessed.pos = wordInfoMatch[2];
    stats.lastWordProcessed.id = parseInt(wordInfoMatch[3], 10);
  }
  
  // Check for batch updates in reprocessing
  const batchMatch = output.match(/Batch (\d+) completed/);
  if (batchMatch && batchMatch[1]) {
    stats.reprocessing.currentBatch = parseInt(batchMatch[1], 10);
  }
  
  // Check for batch results
  const batchResultsMatch = output.match(/Batch results: (\d+) definitions, (\d+) OWAD phrases, (\d+) distractors updated/);
  if (batchResultsMatch && batchResultsMatch[1] && batchResultsMatch[2] && batchResultsMatch[3]) {
    const definitionsUpdated = parseInt(batchResultsMatch[1], 10);
    const owadUpdated = parseInt(batchResultsMatch[2], 10);
    const distractorsUpdated = parseInt(batchResultsMatch[3], 10);
    
    // Update total counts
    stats.reprocessing.definitionsUpdated += definitionsUpdated;
    stats.reprocessing.owadPhrasesUpdated += owadUpdated;
    stats.reprocessing.distractorsUpdated += distractorsUpdated;
    
    // Add batch info
    const batchTimeMatch = output.match(/Batch \d+ completed in (\d+\.?\d*) minutes/);
    const batchTimeMin = batchTimeMatch ? parseFloat(batchTimeMatch[1]) : null;
    
    stats.reprocessing.batches.push({
      batchNumber: stats.reprocessing.currentBatch,
      wordCount: definitionsUpdated, // Assuming this is the number of words in the batch
      definitionsUpdated: definitionsUpdated,
      owadPhrasesUpdated: owadUpdated,
      distractorsUpdated: distractorsUpdated,
      elapsedTimeMin: batchTimeMin
    });
  }
}

// Start the enrichment process
function startProcess() {
  if (isRunning) return;
  
  isRunning = true;
  processStartTime = processStartTime || Date.now();
  
  console.log('Starting word enrichment process...');
  
  const args = [
    'word-enrichment/simple-process.js'
  ];
  
  processInstance = spawn('node', args);
  
  // Handle process output
  processInstance.stdout.on('data', (data) => {
    const output = data.toString();
    parseProcessOutput(output);
    
    if (autoRefresh && (Date.now() - lastRefreshTime > 1000)) {
      renderDashboard();
      lastRefreshTime = Date.now();
    }
  });
  
  // Handle process errors
  processInstance.stderr.on('data', (data) => {
    const error = data.toString();
    stats.errors++;
    
    if (error.includes('rate limit')) {
      stats.rateLimitHits++;
    }
    
    addOutputLine(`${colors.fg.red}${error}${colors.reset}`);
    
    if (autoRefresh) {
      renderDashboard();
    }
  });
  
  // Handle process exit
  processInstance.on('close', (code) => {
    isRunning = false;
    
    if (code !== 0) {
      addOutputLine(`${colors.fg.red}Process exited with code ${code}${colors.reset}`);
    } else {
      addOutputLine(`${colors.fg.green}Process completed successfully${colors.reset}`);
    }
    
    if (autoRefresh) {
      renderDashboard();
    }
  });
  
  renderDashboard();
}

// Stop the enrichment process
function stopProcess() {
  if (!isRunning) return;
  
  console.log('Stopping word enrichment process...');
  
  if (processInstance) {
    processInstance.kill();
    processInstance = null;
  }
  
  isRunning = false;
  renderDashboard();
}

// Restart the enrichment process
function restartProcess() {
  stopProcess();
  
  // Wait a moment before restarting
  setTimeout(() => {
    startProcess();
  }, 2000);
}

// Get total word counts
async function updateWordCounts() {
  try {
    stats.totalWords = await db.countWords();
    stats.remainingWords = await db.countUnprocessedWords();
    stats.processedWords = stats.totalWords - stats.remainingWords;
    renderDashboard();
  } catch (error) {
    addOutputLine(`${colors.fg.red}Error fetching word counts: ${error.message}${colors.reset}`);
  }
}

// Setup key handler for controls
function setupKeyHandler() {
  // Put terminal in raw mode to capture keypress
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      // Ctrl+C - Exit
      stopProcess();
      console.log('Exiting...');
      process.exit(0);
    } else if (key.name === 's') {
      // S - Start/Stop
      if (isRunning) {
        stopProcess();
      } else {
        startProcess();
      }
    } else if (key.name === 'r') {
      // R - Restart
      restartProcess();
    } else if (key.name === 'q') {
      // Q - Quit
      stopProcess();
      console.log('Exiting...');
      process.exit(0);
    } else if (key.name === 'a') {
      // A - Toggle auto-refresh
      autoRefresh = !autoRefresh;
      if (autoRefresh) {
        renderDashboard();
      }
      addOutputLine(`Auto-refresh ${autoRefresh ? 'enabled' : 'disabled'}`);
    }
  });
}

// Initialize and start the dashboard
async function initDashboard() {
  // Initialize stats
  initializeKeyStats();
  
  // Setup key handler
  setupKeyHandler();
  
  // Fetch initial word counts
  await updateWordCounts();
  
  // Render initial dashboard
  renderDashboard();
  
  // Auto-refresh timer
  setInterval(() => {
    if (autoRefresh) {
      renderDashboard();
    }
  }, 3000);
  
  // Check command line args for auto-start
  const autoStart = process.argv.includes('--auto-start') || process.argv.includes('-a');
  if (autoStart) {
    setTimeout(() => {
      startProcess();
    }, 1000);
  }
  
  // Welcome message
  console.log('Dashboard initialized. Press s to start/stop, r to restart, a to toggle auto-refresh, q to quit.');
}

// Run the dashboard
initDashboard().catch(error => {
  console.error('Error initializing dashboard:', error);
  process.exit(1);
}); 