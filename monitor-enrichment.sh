#!/bin/bash

# Monitor script for the datamuse-enricher.js process
# Usage: ./monitor-enrichment.sh [interval_minutes]

# Default check interval is 30 minutes if not specified
INTERVAL_MINUTES=${1:-30}
INTERVAL_SECONDS=$((INTERVAL_MINUTES * 60))
LOG_FILE="enrichment-monitor.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

check_process() {
  if pgrep -f "node datamuse-enricher.js" > /dev/null; then
    log "✅ Enrichment process is running"
    return 0
  else
    log "❌ WARNING: Enrichment process is NOT running!"
    return 1
  fi
}

check_state_file() {
  if [ -f "enrichment-state.json" ]; then
    local last_updated=$(grep -o '"lastUpdated":"[^"]*"' enrichment-state.json | cut -d'"' -f4)
    local start_id=$(grep -o '"startId":[^,]*' enrichment-state.json | cut -d':' -f2)
    local total_processed=$(grep -o '"totalProcessed":[^,]*' enrichment-state.json | cut -d':' -f2)
    local total_successful=$(grep -o '"totalSuccessful":[^,]*' enrichment-state.json | cut -d':' -f2)
    
    log "Current state: Processing from ID $start_id, $total_processed words processed, $total_successful successful"
    log "Last updated: $last_updated"
    
    # Check if state file was updated recently (within twice the check interval)
    local last_update_timestamp=$(date -j -f "%Y-%m-%dT%H:%M:%S.%3NZ" "$last_updated" "+%s" 2>/dev/null)
    local current_timestamp=$(date "+%s")
    local max_age=$((INTERVAL_SECONDS * 2))
    
    if [ $((current_timestamp - last_update_timestamp)) -gt $max_age ]; then
      log "⚠️ WARNING: State file hasn't been updated recently!"
      return 1
    fi
    
    return 0
  else
    log "❌ ERROR: State file not found!"
    return 1
  fi
}

check_log_file() {
  if [ -f "datamuse-enrichment.log" ]; then
    log "Recent log entries:"
    tail -n 5 datamuse-enrichment.log | while read -r line; do
      log "  $line"
    done
    
    # Check for errors in recent log entries
    if tail -n 100 datamuse-enrichment.log | grep -i "error\|exception\|fail" > /dev/null; then
      log "⚠️ WARNING: Recent errors detected in log file!"
      return 1
    fi
    
    return 0
  else
    log "❌ ERROR: Log file not found!"
    return 1
  fi
}

restart_if_needed() {
  if [ $1 -eq 1 ]; then
    log "Attempting to restart the enrichment process..."
    pkill -f "node datamuse-enricher.js" || true
    node datamuse-enricher.js > datamuse-enrichment.log 2>&1 &
    
    if [ $? -eq 0 ]; then
      log "✅ Enrichment process restarted successfully"
    else
      log "❌ Failed to restart enrichment process"
    fi
  fi
}

log "Starting enrichment process monitor (checking every $INTERVAL_MINUTES minutes)"

while true; do
  log "Running status check..."
  
  process_status=0
  check_process || process_status=1
  
  state_status=0
  check_state_file || state_status=1
  
  log_status=0
  check_log_file || log_status=1
  
  # Only restart if process isn't running or state file isn't updating
  if [ $process_status -eq 1 ] || [ $state_status -eq 1 ]; then
    restart_if_needed 1
  fi
  
  log "Status check complete. Next check in $INTERVAL_MINUTES minutes."
  log "---------------------------------------------------------------"
  
  sleep $INTERVAL_SECONDS
done 