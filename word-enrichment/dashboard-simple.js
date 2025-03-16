#!/usr/bin/env node

/**
 * OneWord Enrichment Simple Dashboard
 * Terminal-based dashboard for monitoring the word enrichment process
 * Uses plain node.js and tail-like functionality
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

// Configuration
const LOG_FILE = path.join(__dirname, 'logs/enrichment.log');
const STATS_DIR = path.join(__dirname, 'stats');
const REFRESH_INTERVAL = 2000; // 2 seconds
const LOG_LINES = 15;

// ANSI colors for prettier console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  
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

// Stats
let stats = {
  processedWords: 0,
  totalWords: 0,
  apiCalls: 0,
  errors: 0,
  rateLimitHits: 0,
  keyUsage: {},
  reprocessing: {
    definitionsUpdated: 0,
    owadPhrasesUpdated: 0,
    distractorsUpdated: 0,
    currentBatch: 0
  },
  currentWord: 'N/A',
  currentPos: 'N/A',
  currentId: 0,
  lastUpdated: new Date()
};

// Utilities
function clearScreen() {
  process.stdout.write('\x1bc');
}

function drawLine(char = '═', width = process.stdout.columns) {
  return char.repeat(width);
}

function centerText(text, width = process.stdout.columns) {
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text;
}

// Read the last N lines from a file
function readLastLines(filePath, lineCount) {
  return new Promise((resolve, reject) => {
    exec(`tail -n ${lineCount} "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.split('\n'));
    });
  });
}

// Read the most recent stats file
function readLatestStatsFile() {
  return new Promise((resolve, reject) => {
    fs.readdir(STATS_DIR, (err, files) => {
      if (err) {
        // Stats directory might not exist yet
        resolve(null);
        return;
      }
      
      // Filter for stats JSON files and sort by creation time (newest first)
      const statsFiles = files
        .filter(file => file.startsWith('reprocess-stats-') && file.endsWith('.json'))
        .map(file => path.join(STATS_DIR, file))
        .sort((a, b) => {
          try {
            return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
          } catch (e) {
            return 0;
          }
        });
      
      if (statsFiles.length === 0) {
        resolve(null);
        return;
      }
      
      // Read the newest stats file
      fs.readFile(statsFiles[0], 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
  });
}

// Parse log entries to update stats
function parseLogEntry(line) {
  // Skip empty lines
  if (!line.trim()) return;
  
  // Update last updated time
  stats.lastUpdated = new Date();
  
  // Extract key usage
  const keyMatch = line.match(/using key ([A-Za-z0-9]{6}\.{3}[A-Za-z0-9]{4})/);
  if (keyMatch) {
    const key = keyMatch[1];
    if (!stats.keyUsage[key]) {
      stats.keyUsage[key] = { requests: 0, rateLimits: 0 };
    }
    stats.keyUsage[key].requests++;
  }
  
  // Count API requests
  if (line.includes('API Request successful')) {
    const requestMatch = line.match(/Total requests: (\d+)/);
    if (requestMatch) {
      stats.apiCalls = parseInt(requestMatch[1], 10);
    }
  }
  
  // Count rate limits
  if (line.includes('Rate limit exceeded')) {
    stats.rateLimitHits++;
    
    // Update rate limit for specific key
    const rateLimitKeyMatch = line.match(/key ([A-Za-z0-9]{6}\.{3}[A-Za-z0-9]{4})/);
    if (rateLimitKeyMatch) {
      const key = rateLimitKeyMatch[1];
      if (!stats.keyUsage[key]) {
        stats.keyUsage[key] = { requests: 0, rateLimits: 0 };
      }
      stats.keyUsage[key].rateLimits++;
    }
  }
  
  // Count errors
  if (line.includes('[ERROR]')) {
    stats.errors++;
  }
  
  // Process current word
  const wordMatch = line.match(/Processing word \d+\/\d+: ([a-zA-Z0-9_-]+) \(([a-z]+)\)/);
  if (wordMatch) {
    stats.currentWord = wordMatch[1];
    stats.currentPos = wordMatch[2];
  }
  
  // Process batch completion for reprocessing
  const batchMatch = line.match(/Batch (\d+) completed/);
  if (batchMatch) {
    stats.reprocessing.currentBatch = parseInt(batchMatch[1], 10);
  }
  
  // Update batch results for reprocessing
  const batchResultsMatch = line.match(/Batch results: (\d+) definitions, (\d+) OWAD phrases, (\d+) distractors/);
  if (batchResultsMatch) {
    stats.reprocessing.definitionsUpdated += parseInt(batchResultsMatch[1], 10);
    stats.reprocessing.owadPhrasesUpdated += parseInt(batchResultsMatch[2], 10);
    stats.reprocessing.distractorsUpdated += parseInt(batchResultsMatch[3], 10);
  }
  
  // Update progress
  const progressMatch = line.match(/Progress: (\d+)\/(\d+) words/);
  if (progressMatch) {
    stats.processedWords = parseInt(progressMatch[1], 10);
    stats.totalWords = parseInt(progressMatch[2], 10);
  }
}

// Check if reprocessing is running
function checkProcessRunning() {
  return new Promise((resolve) => {
    exec('ps aux | grep "[r]eprocess-all.js"', (error, stdout) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

// Render dashboard
async function renderDashboard() {
  try {
    // Clear screen
    clearScreen();
    
    // Check if reprocess is running
    const isRunning = await checkProcessRunning();
    
    // Try to get latest stats file data
    const statsFileData = await readLatestStatsFile();
    if (statsFileData) {
      // Update stats from file
      stats.processedWords = statsFileData.processedWords || 0;
      stats.totalWords = statsFileData.totalWords || 0;
      stats.reprocessing.definitionsUpdated = statsFileData.definitionsUpdated || 0;
      stats.reprocessing.owadPhrasesUpdated = statsFileData.owadPhrasesUpdated || 0;
      stats.reprocessing.distractorsUpdated = statsFileData.distractorsUpdated || 0;
      stats.reprocessing.currentBatch = statsFileData.currentBatch || 0;
      
      // Add latest batch info if available
      if (statsFileData.batches && statsFileData.batches.length > 0) {
        stats.latestBatch = statsFileData.batches[statsFileData.batches.length - 1];
      }
    }
    
    // Get log tail
    const logLines = await readLastLines(LOG_FILE, LOG_LINES);
    
    // Parse log lines for stats updates
    logLines.forEach(line => parseLogEntry(line));
    
    // Calculate progress percentage
    const progressPercent = stats.totalWords > 0 
      ? (stats.processedWords / stats.totalWords * 100).toFixed(1) 
      : 0;
    
    // Header
    console.log(colors.bg.blue + colors.fg.white + centerText(' ONEWORD ENRICHMENT DASHBOARD ') + colors.reset);
    console.log('');
    
    // Status
    console.log(`${colors.bright}Status:${colors.reset} ${isRunning ? colors.fg.green + 'RUNNING' : colors.fg.red + 'STOPPED'}${colors.reset}`);
    console.log(`${colors.bright}Last Updated:${colors.reset} ${stats.lastUpdated.toLocaleTimeString()}`);
    console.log(drawLine());
    
    // Progress
    console.log(colors.bg.cyan + colors.fg.black + centerText(' PROGRESS ') + colors.reset);
    console.log(`${colors.bright}Processed:${colors.reset} ${stats.processedWords} / ${stats.totalWords} words (${progressPercent}%)`);
    console.log(`${colors.bright}Current Word:${colors.reset} ${stats.currentWord} (${stats.currentPos})`);
    console.log(drawLine('-'));
    
    // Reprocessing stats
    console.log(colors.bg.green + colors.fg.black + centerText(' REPROCESSING STATS ') + colors.reset);
    console.log(`${colors.bright}Definitions Updated:${colors.reset} ${stats.reprocessing.definitionsUpdated}`);
    console.log(`${colors.bright}OWAD Phrases Updated:${colors.reset} ${stats.reprocessing.owadPhrasesUpdated}`);
    console.log(`${colors.bright}Distractors Updated:${colors.reset} ${stats.reprocessing.distractorsUpdated}`);
    console.log(`${colors.bright}Current Batch:${colors.reset} ${stats.reprocessing.currentBatch}`);
    
    // Latest batch info if available
    if (stats.latestBatch) {
      console.log(colors.bright + 'Latest Batch Info:' + colors.reset);
      console.log(`  - ${colors.dim}Words: ${stats.latestBatch.wordCount || 'N/A'}${colors.reset}`);
      console.log(`  - ${colors.dim}Time: ${stats.latestBatch.elapsedTimeMin || 'N/A'} minutes${colors.reset}`);
    }
    console.log(drawLine('-'));
    
    // API stats
    console.log(colors.bg.magenta + colors.fg.white + centerText(' API USAGE ') + colors.reset);
    console.log(`${colors.bright}Total API Calls:${colors.reset} ${stats.apiCalls}`);
    console.log(`${colors.bright}Rate Limit Hits:${colors.reset} ${stats.rateLimitHits}`);
    console.log(`${colors.bright}Errors:${colors.reset} ${stats.errors}`);
    
    // Key usage table
    if (Object.keys(stats.keyUsage).length > 0) {
      console.log(colors.bright + 'API Key Usage:' + colors.reset);
      Object.entries(stats.keyUsage).forEach(([key, usage]) => {
        console.log(`  - ${key}: ${usage.requests} reqs, ${usage.rateLimits} limits`);
      });
    }
    console.log(drawLine('-'));
    
    // Recent logs
    console.log(colors.bg.yellow + colors.fg.black + centerText(' RECENT LOGS ') + colors.reset);
    logLines.forEach(line => {
      // Colorize log lines
      if (line.includes('[ERROR]')) {
        console.log(colors.fg.red + line + colors.reset);
      } else if (line.includes('[INFO]')) {
        console.log(colors.fg.cyan + line + colors.reset);
      } else {
        console.log(line);
      }
    });
    
    console.log(drawLine());
    console.log(`${colors.bright}Controls:${colors.reset} Press ${colors.fg.red}Ctrl+C${colors.reset} to exit`);
    
  } catch (error) {
    console.error('Error rendering dashboard:', error);
  }
}

// Main function
async function main() {
  console.log('Starting OneWord Enrichment Dashboard...');
  
  // Ensure log file exists
  if (!fs.existsSync(LOG_FILE)) {
    console.log(`Log file not found at ${LOG_FILE}. Creating a placeholder...`);
    if (!fs.existsSync(path.dirname(LOG_FILE))) {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    }
    fs.writeFileSync(LOG_FILE, 'Log file initialized\n');
  }
  
  // Ensure stats directory exists
  if (!fs.existsSync(STATS_DIR)) {
    fs.mkdirSync(STATS_DIR, { recursive: true });
  }
  
  // Render dashboard immediately
  await renderDashboard();
  
  // Setup auto-refresh
  const refreshInterval = setInterval(async () => {
    await renderDashboard();
  }, REFRESH_INTERVAL);
  
  // Handle exit
  process.on('SIGINT', () => {
    clearInterval(refreshInterval);
    console.log('\nExiting dashboard...');
    process.exit(0);
  });
}

// Start dashboard
main().catch(err => {
  console.error('Error starting dashboard:', err);
  process.exit(1);
}); 