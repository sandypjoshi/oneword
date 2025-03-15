# Setting Up Word Enrichment with cron-job.org

This guide will help you set up scheduled execution of your word enrichment process using cron-job.org, a free service for scheduled task execution.

## Step 1: Create an Account

1. Go to [cron-job.org](https://cron-job.org) and sign up for a free account
2. Verify your email address to activate the account

## Step 2: Create a New Cron Job

1. Log in to your cron-job.org account
2. Click on the "Create cronjob" button

## Step 3: Configure the Cron Job

Use these settings for your cron job:

### Basic Settings

- **Title**: Word Enrichment 
- **URL**: `https://ipljgsggnbdwaomjfuok.supabase.co/functions/v1/enrich-words`
- **Execution schedule**: Custom schedule (recommended: every 3-5 minutes)
  - Minutes: */3 (every 3 minutes)
  - Hours: * (every hour)
  - Days: * (every day)
  - Months: * (every month)
  - Weekdays: * (every day of the week)

### Advanced Settings

- **Request method**: POST
- **Request body**: 
  ```json
  {"apiKey": "enrichment-api-secure-key-1234"}
  ```
- **Request headers**:
  - Content-Type: application/json
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE

- **Notification settings**:
  - Enable notifications for failures (recommended)
  - Set up email notification for consecutive failures

## Step 4: Save and Test

1. Save the cron job configuration
2. Use the "Run now" button to test the job immediately
3. Check the "Last run" section to verify it ran successfully

## Monitoring

You can track the progress of your word enrichment process in these ways:

1. **Cron-job.org dashboard**: View job execution history and status
2. **Supabase dashboard**: Check the Logs section for Edge Function executions
3. **Database query**: Check the current state with this SQL:
   ```sql
   SELECT * FROM enrichment_state ORDER BY last_updated DESC LIMIT 1;
   ```

## Adjusting the Process

If you need to make adjustments:

- **Change frequency**: Update the schedule in cron-job.org
- **Process different words**: Update the `start_id` in the enrichment_state table:
  ```sql
  UPDATE enrichment_state SET start_id = 1234 WHERE id = 1;
  ```
- **Increase batch size**: Modify the Edge Function code (BATCH_SIZE constant) and redeploy

## Stopping the Process

To temporarily stop the process, simply disable the cron job in the cron-job.org dashboard.

## Security Notes

- Keep your API keys secure
- Consider rotating the API key periodically
- Use the service role key only for background processing, not in client-side code 