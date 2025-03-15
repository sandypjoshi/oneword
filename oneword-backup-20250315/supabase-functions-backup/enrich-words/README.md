# Word Enrichment Supabase Edge Function

This Edge Function automates the process of enriching words in the database with frequency and syllable data from the Datamuse API.

## Features

- Processes words in batches to stay within Edge Function execution limits
- Tracks state in the database for continuous processing
- Maintains statistics about the enrichment process
- Easily invokable via HTTP for scheduling with cron-job.org

## Setup Instructions

### 1. Create the Enrichment State Table

Run the SQL in `schema.sql` in your Supabase SQL Editor to create the necessary table.

### 2. Set Environment Variables

In your Supabase project dashboard, go to Settings > API > Functions and add these environment variables:

```
ENRICHMENT_API_KEY=your-secure-api-key-here
```

### 3. Deploy the Edge Function

Deploy the Edge Function using the Supabase CLI:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Deploy the function
cd /path/to/your/project
supabase functions deploy enrich-words
```

### 4. Set Up Scheduled Execution with cron-job.org

1. Sign up for a free account at [cron-job.org](https://cron-job.org)
2. Create a new cron job with the following settings:
   - Title: "Word Enrichment"
   - URL: `https://[your-supabase-project].supabase.co/functions/v1/enrich-words`
   - Request method: POST
   - Request body: `{"apiKey": "your-secure-api-key-here"}`
   - Content-Type: application/json
   - Authentication: Bearer [your-supabase-anon-key]
   - Schedule: Every 1-5 minutes (depending on your needs)

### 5. Monitor the Process

You can monitor the enrichment process by querying the `enrichment_state` table:

```sql
SELECT * FROM enrichment_state ORDER BY last_updated DESC LIMIT 1;
```

## Local Testing

To test the function locally before deploying:

```bash
# Start local Supabase instance
supabase start

# Run the function locally
supabase functions serve enrich-words

# Test with curl
curl -X POST http://localhost:54321/functions/v1/enrich-words \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"apiKey": "your-secure-api-key-here"}'
```

## Client Script

You can also use the provided `scripts/call-enrichment-api.js` script to call the function:

```bash
node scripts/call-enrichment-api.js
```

## Troubleshooting

- If the function times out, reduce the batch size (`BATCH_SIZE`)
- If you need to reset the process, update the `startId` in the `enrichment_state` table 