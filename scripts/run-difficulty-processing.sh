#!/bin/bash

# Run Difficulty Processing script
# This script runs the difficulty processing in continuous mode
# and logs the output to a file

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the processing script in continuous mode
echo "Starting difficulty processing in continuous mode..."
echo "Logs will be saved to logs/difficulty-processing.log"
echo "Press Ctrl+C to stop"

# Run the script and redirect output to log file
node scripts/process-difficulty.js --continuous > logs/difficulty-processing.log 2>&1 