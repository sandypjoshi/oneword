#!/usr/bin/env node

/**
 * Dashboard Starter Script
 * This script installs required dependencies and starts the enrichment dashboard
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Required packages for the dashboard
const REQUIRED_PACKAGES = [
  'blessed',
  'blessed-contrib'
];

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('auto-start', {
    alias: 'a',
    type: 'boolean',
    description: 'Auto-start the enrichment process after dashboard loads',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

// Get command line options
const autoStart = argv['auto-start'];

/**
 * Check if required packages are installed
 * @returns {Promise<boolean>} - Whether all packages are installed
 */
function checkDependencies() {
  return new Promise((resolve) => {
    exec('npm list --depth=0', (error, stdout) => {
      if (error) {
        console.error('Error checking dependencies:', error.message);
        resolve(false);
        return;
      }
      
      const missingPackages = REQUIRED_PACKAGES.filter(pkg => !stdout.includes(pkg));
      
      if (missingPackages.length > 0) {
        console.log(`Installing missing dependencies: ${missingPackages.join(', ')}`);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Install missing dependencies
 * @returns {Promise<boolean>} - Whether installation was successful
 */
function installDependencies() {
  return new Promise((resolve) => {
    const installProcess = spawn('npm', ['install', ...REQUIRED_PACKAGES, '--save-dev'], {
      stdio: 'inherit'
    });
    
    installProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`npm install exited with code ${code}`);
        resolve(false);
      } else {
        console.log('Dependencies installed successfully');
        resolve(true);
      }
    });
  });
}

/**
 * Start the dashboard
 */
function startDashboard() {
  const args = ['word-enrichment/dashboard.js'];
  
  // Pass auto-start parameter if needed
  if (autoStart) {
    args.push('--auto-start');
  }
  
  const dashboardProcess = spawn('node', args, {
    stdio: 'inherit'
  });
  
  dashboardProcess.on('error', (error) => {
    console.error('Failed to start dashboard:', error.message);
  });
  
  dashboardProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Dashboard exited with code ${code}`);
    }
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Starting OneWord Enrichment Dashboard...');
  
  try {
    // Check if dependencies are installed
    const dependenciesInstalled = await checkDependencies();
    
    // Install dependencies if needed
    if (!dependenciesInstalled) {
      const installSuccess = await installDependencies();
      if (!installSuccess) {
        console.error('Failed to install dependencies. Please install manually:');
        console.error(`npm install ${REQUIRED_PACKAGES.join(' ')} --save-dev`);
        process.exit(1);
      }
    }
    
    // Start the dashboard
    startDashboard();
    
  } catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

// Run the main function
main(); 