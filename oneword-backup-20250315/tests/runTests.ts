/**
 * Test Runner for OneWord App
 * 
 * Simple test runner that executes all test files in the tests directory
 * without requiring an external testing framework.
 */

import path from 'path';
import fs from 'fs';
import { execSync, spawnSync } from 'child_process';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Log with colors
const log = {
  info: (msg: string) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Get all test files
function getTestFiles(): string[] {
  const testsDir = path.join(__dirname, '/');
  const allFiles = fs.readdirSync(testsDir);
  return allFiles
    .filter(file => file.endsWith('.test.ts') && file !== 'runTests.ts')
    .map(file => path.join(testsDir, file));
}

// Check if a file compiles without errors
function checkCompilation(filePath: string): { success: boolean, error?: string } {
  try {
    // Use tsc to check if the file compiles (--noEmit means don't output JS files)
    const result = spawnSync('npx', ['tsc', '--noEmit', filePath], { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (result.status !== 0) {
      return { 
        success: false, 
        error: result.stderr || result.stdout 
      };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to check compilation: ${error}` 
    };
  }
}

// Run a single test file
async function runTestFile(filePath: string): Promise<boolean> {
  const fileName = path.basename(filePath);
  log.info(`Running tests in ${fileName}...`);
  
  // First check if the file compiles
  const compilation = checkCompilation(filePath);
  if (!compilation.success) {
    log.error(`✗ ${fileName} - Compilation failed`);
    log.error(compilation.error || 'Unknown compilation error');
    return false;
  }
  
  try {
    // Execute the test file using ts-node
    execSync(`npx ts-node ${filePath}`, { stdio: 'inherit' });
    log.success(`✓ ${fileName} - Tests passed`);
    return true;
  } catch (error) {
    log.error(`✗ ${fileName} - Tests failed`);
    return false;
  }
}

// Main function to run all tests
async function runAllTests() {
  log.header('ONEWORD APP TEST RUNNER');
  
  const testFiles = getTestFiles();
  log.info(`Found ${testFiles.length} test files to run\n`);
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const file of testFiles) {
    const passed = await runTestFile(file);
    if (passed) {
      passedCount++;
    } else {
      failedCount++;
    }
    console.log(); // Add a blank line between test files
  }
  
  log.header('TEST SUMMARY');
  log.info(`Total test files: ${testFiles.length}`);
  
  if (failedCount === 0) {
    log.success(`All test files passed!`);
  } else {
    log.success(`Passed: ${passedCount} files`);
    log.error(`Failed: ${failedCount} files`);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    log.error('Test runner failed with error:');
    console.error(error);
    process.exit(1);
  });
} 