/**
 * Logger utility for consistent debugging across the app
 * 
 * This utility provides structured logging that can be enabled/disabled
 * globally or per component/module.
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Global settings
const settings = {
  enabled: __DEV__, // Only enable in development by default
  minLevel: LogLevel.DEBUG, // Minimum level to show
  storeLogs: true, // Keep logs in memory for debugging
};

// In-memory log storage
const logHistory: LogEntry[] = [];
const MAX_LOGS = 1000; // Limit log history to prevent memory issues

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
}

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  
  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

// Level-specific formatting
const levelFormats = {
  [LogLevel.DEBUG]: {
    prefix: 'DEBUG',
    style: `${colors.dim}${colors.cyan}`,
    consoleMethod: 'debug',
  },
  [LogLevel.INFO]: {
    prefix: 'INFO',
    style: `${colors.green}`,
    consoleMethod: 'info',
  },
  [LogLevel.WARN]: {
    prefix: 'WARN',
    style: `${colors.yellow}`,
    consoleMethod: 'warn',
  },
  [LogLevel.ERROR]: {
    prefix: 'ERROR',
    style: `${colors.bright}${colors.red}`,
    consoleMethod: 'error',
  },
};

/**
 * Create a namespaced logger instance
 * 
 * @param namespace - The namespace for this logger (usually component or module name)
 * @returns Object with logging methods for each level
 */
export function createLogger(namespace: string) {
  // Helper function to log at a specific level
  const logAtLevel = (level: LogLevel, message: string, data?: any) => {
    if (!settings.enabled || level < settings.minLevel) {
      return; // Skip logging if disabled or below minimum level
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      namespace,
      message,
      data,
    };

    // Add to history if enabled
    if (settings.storeLogs) {
      logHistory.push(entry);
      // Trim if exceeding max size
      if (logHistory.length > MAX_LOGS) {
        logHistory.shift();
      }
    }

    // Format for console
    const format = levelFormats[level];
    const timestamp = entry.timestamp.toISOString().split('T')[1].replace('Z', '');
    
    // Use the appropriate console method with formatted output
    const formattedMessage = `${format.style}[${format.prefix}]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${colors.bright}[${namespace}]${colors.reset} ${message}`;
    
    // Log to console with appropriate method based on level
    if (level === LogLevel.ERROR) {
      data !== undefined ? console.error(formattedMessage, data) : console.error(formattedMessage);
    } else if (level === LogLevel.WARN) {
      data !== undefined ? console.warn(formattedMessage, data) : console.warn(formattedMessage);
    } else if (level === LogLevel.INFO) {
      data !== undefined ? console.info(formattedMessage, data) : console.info(formattedMessage);
    } else {
      data !== undefined ? console.log(formattedMessage, data) : console.log(formattedMessage);
    }
  };

  return {
    debug: (message: string, data?: any) => logAtLevel(LogLevel.DEBUG, message, data),
    info: (message: string, data?: any) => logAtLevel(LogLevel.INFO, message, data),
    warn: (message: string, data?: any) => logAtLevel(LogLevel.WARN, message, data),
    error: (message: string, data?: any) => logAtLevel(LogLevel.ERROR, message, data),
  };
}

/**
 * Configure global logger settings
 */
export function configureLogger(config: Partial<typeof settings>) {
  Object.assign(settings, config);
}

/**
 * Get all stored logs
 */
export function getLogs(): LogEntry[] {
  return [...logHistory];
}

/**
 * Clear log history
 */
export function clearLogs() {
  logHistory.length = 0;
}

// Default export for convenience
export default {
  createLogger,
  configureLogger,
  getLogs,
  clearLogs,
  LogLevel,
}; 