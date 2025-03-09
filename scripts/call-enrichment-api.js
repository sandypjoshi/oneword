/**
 * Client script to call the Supabase Edge Function for word enrichment
 * This can be used with cron-job.org to trigger the enrichment process
 */
require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const FUNCTION_NAME = 'enrich-words';
const API_KEY = process.env.ENRICHMENT_API_KEY || 'enrichment-api-secure-key-1234';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';

// Log file
const LOG_FILE = 'enrichment-api-calls.log';

/**
 * Call the Edge Function
 */
async function callEnrichmentFunction() {
  try {
    console.log(`Calling Supabase Edge Function: ${FUNCTION_NAME}`);
    console.log(`Using auth: Bearer ${SERVICE_KEY.substring(0, 10)}...`);
    
    const startTime = new Date();
    
    // Call the Supabase Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ apiKey: API_KEY })
      }
    );
    
    const endTime = new Date();
    const executionTimeMs = endTime - startTime;
    
    // Process the response
    const text = await response.text();
    let result;
    
    try {
      result = JSON.parse(text);
    } catch (e) {
      result = { error: 'Failed to parse response', text };
    }
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      statusCode: response.status,
      executionTimeMs,
      success: response.ok,
      result
    };
    
    // Log to console
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Execution time: ${executionTimeMs}ms`);
    
    if (response.ok) {
      console.log('Success!');
      if (result.processed) {
        console.log(`Processed ${result.processed} words, ${result.successful} successful, ${result.failed} failed, ${result.skipped} skipped`);
      }
      console.log('Current state:', JSON.stringify(result.state, null, 2));
    } else {
      console.error('Error:', result.error || text);
    }
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
    
    return { success: response.ok, result };
  } catch (error) {
    console.error('Error calling Supabase Edge Function:', error);
    
    // Log the error
    const logEntry = {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    };
    
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
    
    return { success: false, error: error.message };
  }
}

// Run the function
callEnrichmentFunction()
  .then(result => {
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 