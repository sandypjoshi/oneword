#!/usr/bin/env node

/**
 * OneWord Enrichment Dashboard
 * Advanced terminal-based dashboard using blessed for monitoring the word enrichment process
 */
const blessed = require('blessed');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const LOG_FILE = path.join(__dirname, 'logs/enrichment.log');
const STATS_DIR = path.join(__dirname, 'stats');
const REFRESH_INTERVAL = 2000; // 2 seconds
const LOG_LINES = 15;

// Create a screen object
const screen = blessed.screen({
  smartCSR: true,
  title: 'OneWord Enrichment Dashboard',
  cursor: {
    artificial: true,
    shape: 'line',
    blink: true,
    color: 'cyan'
  }
});

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
  latestBatch: null,
  currentWord: 'N/A',
  currentPos: 'N/A',
  isRunning: false,
  lastUpdated: new Date(),
  recentWords: [],
  estimatedTimeRemaining: 'N/A',
  wordRate: 0
};

// Create UI layout
const layout = {
  // Header with title and status
  header: blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: {
      fg: 'white',
      bg: 'blue',
      border: {
        fg: 'white'
      }
    }
  }),

  // Left side - Progress and stats
  leftPanel: blessed.box({
    top: 3,
    left: 0,
    width: '50%',
    height: '75%',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'white'
      }
    }
  }),

  // Right side - API usage and latest batch info
  rightPanel: blessed.box({
    top: 3,
    right: 0,
    width: '50%',
    height: '75%',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'white'
      }
    }
  }),

  // Bottom - Recent logs
  logBox: blessed.log({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '22%',
    tags: true,
    border: {
      type: 'line'
    },
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    scrollbar: {
      ch: ' ',
      style: {
        bg: 'blue'
      }
    },
    style: {
      fg: 'white',
      border: {
        fg: 'white'
      }
    }
  }),

  // Progress bar
  progressBar: blessed.progressbar({
    parent: screen,
    top: 11,
    left: 2,
    width: '48%-4',
    height: 3,
    style: {
      bar: {
        bg: 'green',
        fg: 'black'
      },
      border: {
        fg: 'white'
      },
      bg: 'black'
    },
    border: {
      type: 'line'
    },
    filled: 0
  }),

  // API calls by key chart
  apiChart: blessed.box({
    parent: screen,
    top: 4,
    right: 2,
    width: '50%-4',
    height: 15,
    tags: true,
    style: {
      fg: 'white'
    }
  }),

  // Recent words processed
  recentWordsBox: blessed.box({
    parent: screen,
    top: 14,
    left: 2,
    width: '48%-4',
    height: 10,
    tags: true,
    style: {
      fg: 'white'
    },
    scrollable: true
  })
};

// Add all elements to the screen
screen.append(layout.header);
screen.append(layout.leftPanel);
screen.append(layout.rightPanel);
screen.append(layout.logBox);

// Key bindings
screen.key(['escape', 'q', 'C-c'], function() {
  return process.exit(0);
});

screen.key(['r'], function() {
  layout.logBox.setContent('Refreshing dashboard...');
  refreshData();
});

/**
 * Utility functions
 */

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
  
  // Check if reprocessing is running
  if (line.includes('Starting reprocessing') || line.includes('Processing batch')) {
    stats.isRunning = true;
  }
  
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
  const wordMatch = line.match(/Processing (?:results for )?word \d+\/\d+: ([a-zA-Z0-9_-]+) \(([a-z]+)\)/);
  if (wordMatch) {
    const word = wordMatch[1];
    const pos = wordMatch[2];
    stats.currentWord = word;
    stats.currentPos = pos;
    
    // Add to recent words (max 10)
    stats.recentWords.unshift(`${word} (${pos})`);
    if (stats.recentWords.length > 10) {
      stats.recentWords.pop();
    }
  }
  
  // Process word rate and estimated time
  const speedMatch = line.match(/Speed: (\d+) words\/minute, Est\. time remaining: (\d+) minutes/);
  if (speedMatch) {
    stats.wordRate = parseInt(speedMatch[1], 10);
    const remainingMinutes = parseInt(speedMatch[2], 10);
    
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    stats.estimatedTimeRemaining = `${hours}h ${minutes}m`;
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

// Render dashboard content
function renderDashboard() {
  // Format percent
  const progressPercent = stats.totalWords > 0 
    ? (stats.processedWords / stats.totalWords * 100)
    : 0;
  
  // Update header with status and time
  const statusColor = stats.isRunning ? '{green-fg}RUNNING{/}' : '{red-fg}STOPPED{/}';
  layout.header.setContent(
    `{center}{bold}ONEWORD ENRICHMENT DASHBOARD{/bold}{/center}\n` +
    `Status: ${statusColor} | Last Updated: ${stats.lastUpdated.toLocaleTimeString()} | Press {blue-fg}r{/} to refresh | {red-fg}q{/} to quit`
  );
  
  // Update left panel with progress stats
  let leftContent = 
    `{center}{white-bg}{black-fg} PROGRESS {/black-fg}{/white-bg}{/center}\n\n` +
    `{bold}Processed:{/bold} ${stats.processedWords} / ${stats.totalWords} words (${progressPercent.toFixed(1)}%)\n` +
    `{bold}Current Word:{/bold} ${stats.currentWord} (${stats.currentPos})\n` +
    `{bold}Processing Rate:{/bold} ${stats.wordRate} words/minute\n` +
    `{bold}Estimated Remaining:{/bold} ${stats.estimatedTimeRemaining}\n\n` +
    `{center}{white-bg}{black-fg} REPROCESSING STATS {/black-fg}{/white-bg}{/center}\n\n` +
    `{bold}Definitions Updated:{/bold} ${stats.reprocessing.definitionsUpdated}\n` +
    `{bold}OWAD Phrases Updated:{/bold} ${stats.reprocessing.owadPhrasesUpdated}\n` +
    `{bold}Distractors Updated:{/bold} ${stats.reprocessing.distractorsUpdated}\n` +
    `{bold}Current Batch:{/bold} ${stats.reprocessing.currentBatch}\n`;
  
  if (stats.latestBatch) {
    leftContent += '\n{bold}Latest Batch Info:{/bold}\n' +
      `  - Words: ${stats.latestBatch.wordCount || 'N/A'}\n` +
      `  - Time: ${stats.latestBatch.elapsedTimeMin || 'N/A'} minutes\n`;
  }
  
  layout.leftPanel.setContent(leftContent);
  
  // Update right panel with API usage
  let rightContent = 
    `{center}{white-bg}{black-fg} API USAGE {/black-fg}{/white-bg}{/center}\n\n` +
    `{bold}Total API Calls:{/bold} ${stats.apiCalls}\n` +
    `{bold}Rate Limit Hits:{/bold} ${stats.rateLimitHits}\n` +
    `{bold}Errors:{/bold} ${stats.errors}\n\n` +
    `{bold}API Key Usage:{/bold}\n`;
  
  Object.entries(stats.keyUsage).forEach(([key, usage]) => {
    rightContent += `  - ${key}: ${usage.requests} reqs, ${usage.rateLimits} limits\n`;
  });
  
  rightContent += `\n{center}{white-bg}{black-fg} RECENT WORDS {/black-fg}{/white-bg}{/center}\n\n`;
  stats.recentWords.forEach((word, index) => {
    rightContent += `  ${index + 1}. ${word}\n`;
  });
  
  layout.rightPanel.setContent(rightContent);
  
  // Update progress bar
  layout.progressBar.setProgress(progressPercent);
  
  // Refresh screen
  screen.render();
}

// Refresh data
async function refreshData() {
  try {
    // Check if reprocess is running
    stats.isRunning = await checkProcessRunning();
    
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
    
    // Update log box with colorized logs
    layout.logBox.setContent('');
    logLines.forEach(line => {
      if (line.includes('[ERROR]')) {
        layout.logBox.add(`{red-fg}${line}{/red-fg}`);
      } else if (line.includes('[INFO]')) {
        layout.logBox.add(`{cyan-fg}${line}{/cyan-fg}`);
      } else {
        layout.logBox.add(line);
      }
    });
    
    // Render the dashboard with updated data
    renderDashboard();
    
  } catch (error) {
    layout.logBox.add(`{red-fg}Error refreshing dashboard: ${error.message}{/red-fg}`);
    screen.render();
  }
}

// Main function
async function main() {
  // Initial message
  layout.logBox.add('Starting OneWord Enrichment Dashboard...');
  screen.render();
  
  // Ensure log file exists
  if (!fs.existsSync(LOG_FILE)) {
    layout.logBox.add(`Log file not found at ${LOG_FILE}. Creating a placeholder...`);
    screen.render();
    
    if (!fs.existsSync(path.dirname(LOG_FILE))) {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    }
    fs.writeFileSync(LOG_FILE, 'Log file initialized\n');
  }
  
  // Ensure stats directory exists
  if (!fs.existsSync(STATS_DIR)) {
    fs.mkdirSync(STATS_DIR, { recursive: true });
  }
  
  // Initial refresh
  await refreshData();
  
  // Setup auto-refresh
  setInterval(refreshData, REFRESH_INTERVAL);
}

// Start dashboard
main().catch(err => {
  layout.logBox.add(`{red-fg}Error starting dashboard: ${err.message}{/red-fg}`);
  screen.render();
}); 