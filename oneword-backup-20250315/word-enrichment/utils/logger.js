const fs = require('fs');
const path = require('path');
const config = require('../config');

class Logger {
  constructor(logFileName = 'enrichment.log') {
    // Create log directory if it doesn't exist
    if (!fs.existsSync(config.LOG_DIR)) {
      fs.mkdirSync(config.LOG_DIR, { recursive: true });
    }
    
    this.logFilePath = path.join(config.LOG_DIR, logFileName);
    this.consoleEnabled = true;
  }
  
  /**
   * Log an info message
   * @param {string} message - Message to log
   */
  info(message) {
    this._writeLog(`[INFO] ${message}`);
    if (this.consoleEnabled) {
      console.log(`\x1b[32m[INFO]\x1b[0m ${message}`);
    }
  }
  
  /**
   * Log a warning message
   * @param {string} message - Message to log
   */
  warn(message) {
    this._writeLog(`[WARN] ${message}`);
    if (this.consoleEnabled) {
      console.log(`\x1b[33m[WARN]\x1b[0m ${message}`);
    }
  }
  
  /**
   * Log an error message
   * @param {string|Error} error - Error message or Error object
   */
  error(error) {
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : error;
    this._writeLog(`[ERROR] ${message}`);
    if (this.consoleEnabled) {
      console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
    }
  }
  
  /**
   * Log a success message
   * @param {string} message - Message to log
   */
  success(message) {
    this._writeLog(`[SUCCESS] ${message}`);
    if (this.consoleEnabled) {
      console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
    }
  }
  
  /**
   * Log a progress update
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @param {string} prefix - Prefix for the progress message
   */
  progress(current, total, prefix = 'Progress') {
    const percent = ((current / total) * 100).toFixed(2);
    const message = `${prefix}: ${current}/${total} (${percent}%)`;
    
    if (this.consoleEnabled) {
      console.log(`\x1b[36m[PROGRESS]\x1b[0m ${message}`);
    }
    
    // Log progress to file only every 5% or at the end
    if (current % Math.ceil(total * 0.05) === 0 || current === total) {
      this._writeLog(`[PROGRESS] ${message}`);
    }
  }
  
  /**
   * Disable console output (useful for tests)
   */
  disableConsole() {
    this.consoleEnabled = false;
  }
  
  /**
   * Enable console output
   */
  enableConsole() {
    this.consoleEnabled = true;
  }
  
  /**
   * Write a log entry to the log file
   * @param {string} message - Message to write
   * @private
   */
  _writeLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} ${message}\n`;
    
    fs.appendFileSync(this.logFilePath, logEntry);
  }
}

module.exports = new Logger(); 