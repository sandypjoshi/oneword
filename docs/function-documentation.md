# OneWord Supabase Edge Functions Documentation

This document provides a comprehensive overview of the Supabase Edge Functions used in the OneWord application for word difficulty calculation and daily word assignment.

## Table of Contents

1. [Overview](#overview)
2. [Functions](#functions)
   - [calculate-word-difficulty](#calculate-word-difficulty)
   - [select-daily-words](#select-daily-words)
   - [daily-word-assignment](#daily-word-assignment)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Overview

The OneWord application uses Supabase Edge Functions to handle the following core tasks:

1. **Calculating word difficulty** based on various linguistic metrics
2. **Selecting appropriate words** for each date based on difficulty levels
3. **Automatically assigning new words** for future dates on a scheduled basis

These functions work together to ensure a consistent flow of appropriately classified words for the OneWord application, enhancing the user experience by providing words that match their skill level.

## Functions

### calculate-word-difficulty

**Purpose**: Calculates the difficulty level of a given word using various linguistic metrics.

**Key Features**:
- Uses Datamuse API to gather frequency and linguistic data
- Implements caching to reduce API calls
- Applies rate limiting to respect API usage limits
- Calculates a comprehensive difficulty score based on multiple weighted factors
- Updates the word's difficulty level in the database

**Input Parameters**:
```json
{
  "word": "example",
  "includeFactors": true,
  "thresholds": {
    "beginner": 0.35,
    "intermediate": 0.65
  }
}
```

**Output**:
```json
{
  "word": "example",
  "score": 0.42,
  "level": "intermediate",
  "factors": {
    "frequency": 0.35,
    "syllables": 0.43,
    "length": 0.47,
    "posComplexity": 0.5,
    "hyphenation": 0,
    "uncommonLetters": 0
  }
}
```

**Difficulty Calculation Metrics**:
- Word frequency (50% weight): Based on Datamuse frequency data
- Syllable count (15% weight): Normalized by max reasonable syllables (7)
- Word length (15% weight): Normalized by max reasonable length (15)
- Part of speech complexity (10% weight): Nouns (0.3), verbs (0.5), adjectives (0.7), adverbs (0.8)
- Hyphenation (5% weight): 0 or 0.1 based on presence of hyphens
- Uncommon letters (5% weight): 0 or 0.1 based on presence of uncommon letters (z, x, qu, ph)

**Implementation Details**:
- The function caches Datamuse API results to avoid duplicate calls
- Implements fallback mechanisms for missing API data
- Updates the word's difficulty score and level in the database if the word exists

### select-daily-words

**Purpose**: Selects appropriate words for a given date or date range based on difficulty levels.

**Key Features**:
- Selects words based on configurable difficulty distribution
- Ensures diverse part-of-speech representation
- Filters out recently used words to avoid repetition
- Supports date ranges for batch processing
- Can force recalculation and reassignment of words

**Input Parameters**:
```json
{
  "date": "2025-01-01",
  "startDate": "2025-01-01",
  "endDate": "2025-01-07",
  "force": false,
  "wordsPerDay": 3,
  "skipFilters": false,
  "useMockData": false
}
```

**Output for Single Date**:
```json
{
  "date": "2025-01-01",
  "words": [
    {
      "date": "2025-01-01",
      "word_id": 123,
      "word": "example",
      "difficulty_level": "beginner"
    },
    {
      "date": "2025-01-01",
      "word_id": 456,
      "word": "constitution",
      "difficulty_level": "intermediate"
    },
    {
      "date": "2025-01-01",
      "word_id": 789,
      "word": "esoteric",
      "difficulty_level": "advanced"
    }
  ],
  "message": "Words successfully assigned"
}
```

**Implementation Details**:
- Maintains a cache of eligible words to improve performance
- Implements POS (part of speech) balancing to ensure diversity
- Avoids repeating words used in the last 90 days (configurable)
- Provides mock data option for testing without database access

### daily-word-assignment

**Purpose**: Automatically assigns words for the next day, designed to be run on a daily schedule.

**Key Features**:
- Scheduled to run daily via Supabase scheduler
- Invokes the select-daily-words function for the next day
- Can accept a custom date via POST parameters
- Provides detailed logs and error reporting

**Input Parameters**:
```json
{
  "date": "2025-01-01",
  "force": false,
  "useMockData": false
}
```

**Output**:
```json
{
  "success": true,
  "date": "2025-01-01",
  "words": [
    {"word": "plant", "difficulty_level": "beginner"},
    {"word": "masterpiece", "difficulty_level": "intermediate"},
    {"word": "relation", "difficulty_level": "advanced"}
  ],
  "message": "Successfully assigned words for 2025-01-01"
}
```

**Implementation Details**:
- Determines the next day's date if not provided
- Handles failures gracefully with descriptive error messages
- Can be configured to use mock data for testing

## Configuration

### Difficulty Thresholds

The default difficulty thresholds are:
- Beginner: 0.0 - 0.35
- Intermediate: 0.35 - 0.65
- Advanced: > 0.65

These thresholds can be customized by passing a `thresholds` parameter to the `calculate-word-difficulty` function.

### Words Per Day

By default, the system assigns 3 words per day, one for each difficulty level. This can be configured by setting the `wordsPerDay` parameter when calling the `select-daily-words` function.

### Part of Speech Distribution

The default distribution ensures a variety of parts of speech:
- Nouns: 40%
- Verbs: 30%
- Adjectives: 20%
- Adverbs: 10%

### Environment Variables

The following environment variables can be set to configure the functions:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `DIFFICULTY_WEIGHTS`: JSON string containing custom weightings for difficulty factors
- `DIFFICULTY_THRESHOLDS`: JSON string containing custom thresholds for difficulty levels

Example of setting environment variables:
```bash
supabase secrets set DIFFICULTY_WEIGHTS='{"frequency":0.5,"syllables":0.15,"length":0.15,"posComplexity":0.1,"hyphenation":0.05,"uncommonLetters":0.05}'
```

## Deployment

The functions can be deployed using the Supabase CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Deploy functions
supabase functions deploy calculate-word-difficulty
supabase functions deploy select-daily-words
supabase functions deploy daily-word-assignment
```

### Setting Up Daily Schedule

To set up daily word assignment:

1. Log in to the Supabase Dashboard
2. Navigate to Edge Functions
3. Select the `daily-word-assignment` function
4. Click on "Schedule"
5. Set up a CRON job (e.g., `0 0 * * *` for midnight every day)

## Testing

You can test the functions using curl:

```bash
# Test calculate-word-difficulty
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/calculate-word-difficulty' \
  -H 'Authorization: Bearer [ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"word": "example", "includeFactors": true}'

# Test select-daily-words
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/select-daily-words' \
  -H 'Authorization: Bearer [ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"date": "2025-01-01", "force": true}'

# Test daily-word-assignment
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/daily-word-assignment' \
  -H 'Authorization: Bearer [ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"date": "2025-01-01", "force": true, "useMockData": true}'
```

To use mock data for testing, set `useMockData: true` in the request body.

## Troubleshooting

### Common Issues

1. **API Rate Limiting**: The Datamuse API has rate limits. If you encounter errors, the function will automatically retry with backoff.

2. **No Words Selected**: This might happen if:
   - No words match the difficulty criteria
   - All eligible words have been used recently
   - Filters are too restrictive

3. **Error Connecting to Supabase**: Check your environment variables and ensure the service role key has proper permissions.

### Logs

To view function logs:

```bash
supabase functions logs
```

You can filter logs for a specific function:

```bash
supabase functions logs --filter-function=daily-word-assignment
```

### Error Handling

All functions implement comprehensive error handling:
- API failures are gracefully handled with fallback mechanisms
- Database errors are properly reported
- Input validation errors return appropriate HTTP status codes 