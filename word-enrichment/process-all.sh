#!/bin/bash

# OneWord Enrichment All Words Processing Script
# This script runs the dashboard with auto-start

echo "=== OneWord Enrichment Dashboard ==="
echo "Starting dashboard with auto-start enabled..."
echo "Dashboard will automatically process only words that don't have definitions or OWAD phrases"
echo "Press SPACE to stop/start, ESC or q to quit"
echo ""

# Start the dashboard with auto-start enabled
node word-enrichment/dashboard.js --auto-start 