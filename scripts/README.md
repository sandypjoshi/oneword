# WordNet Processing Scripts for OneWord App

This directory contains scripts for processing WordNet data and preparing it for use in the OneWord app.

## Overview

The scripts in this directory help you:

1. Parse WordNet data files and extract relevant information
2. Calculate word difficulty scores based on multiple factors
3. Generate distractors for each word using semantic relationships
4. Select and insert daily words for each difficulty level

## Prerequisites

- Node.js (v14 or later)
- WordNet 3.1 data files (extracted from the tar.gz archive)
- Supabase project with appropriate tables set up

## Setup

1. Make sure you've extracted the WordNet 3.1 data files to the `wordnet-data` directory
2. Set up environment variables for Supabase:
   ```
   export SUPABASE_URL=your_supabase_url
   export SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Scripts

### 1. Create Tables

This script creates the necessary tables in your Supabase database.

```bash
node scripts/create-tables.js
```

### 2. Parse WordNet Data

This script parses the WordNet data files and extracts words, synsets, relationships, and domains.

```bash
node scripts/parse-wordnet.js
```

The script will:
- Process all WordNet data files
- Calculate difficulty scores for each word
- Export the processed data to JSON files in the `wordnet-processed` directory
- Insert the data into Supabase (if credentials are provided)

### 3. Generate Distractors

This script generates distractors for each word using WordNet relationships.

```bash
node scripts/generate-distractors.js
```

The script will:
- Load the processed WordNet data
- Generate various types of distractors for each word (synonyms, hypernyms, etc.)
- Save the distractors to a JSON file
- Insert the distractors into Supabase (if credentials are provided)

### 4. Select Daily Words

This script selects daily words for each difficulty level and inserts them into the daily_words table.

```bash
node scripts/select-daily-words.js [options]
```

Options:
- `--start-date YYYY-MM-DD`: Start date for generating daily words (default: today)
- `--end-date YYYY-MM-DD`: End date for generating daily words (default: today)
- `--days N`: Number of days to generate from start date (alternative to end-date)
- `--force`: Override existing daily words for the date range

Example:
```bash
# Generate words for the next 30 days
node scripts/select-daily-words.js --days 30

# Generate words for a specific date range
node scripts/select-daily-words.js --start-date 2024-05-01 --end-date 2024-05-31
```

## Processing Flow

The recommended processing flow is:

1. Run `create-tables.js` to set up the database tables
2. Run `parse-wordnet.js` to process the WordNet data
3. Run `generate-distractors.js` to create distractors
4. Run `select-daily-words.js` to generate daily words

## Output Files

The scripts generate the following output files in the `wordnet-processed` directory:

- `words.json`: Processed words with difficulty scores
- `synsets.json`: Synsets with definitions and part of speech
- `word-synsets.json`: Mappings between words and synsets
- `relationships.json`: Semantic relationships between synsets
- `domains.json`: Lexical domains
- `distractors.json`: Generated distractors for each word
- `daily-words.json`: Generated daily words for each difficulty level

## Troubleshooting

- If you encounter memory issues, adjust the batch size in the scripts
- If the parsing fails, check that the WordNet data files are correctly located
- If the database insertions fail, check your Supabase credentials and table structure 