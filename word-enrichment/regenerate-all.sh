#!/bin/bash

# OneWord Complete Regeneration Script
# This script regenerates ALL content for ALL words, including those that already have values

echo "=== OneWord Complete Regeneration Process ==="
echo "This script will regenerate ALL definitions, OWAD phrases, and distractors"
echo "for ALL words in the database, overwriting existing content."
echo ""
echo "Make sure you have stopped any other running word processes!"
echo ""
echo "Key features:"
echo "- Uses difficulty-based distractor strategy"
echo "- Tracks API key usage and performance metrics"
echo "- Provides detailed progress reporting"
echo ""
echo "Process will continue from where it leaves off if interrupted."
echo ""

# Prompt for confirmation
read -p "Are you sure you want to start the complete regeneration process? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Make the script executable if it isn't already
  chmod +x word-enrichment/regenerate-all.js
  
  # Start the regeneration process
  echo "Starting regeneration process..."
  node word-enrichment/regenerate-all.js
else
  echo "Regeneration process cancelled."
fi 