# Word Enrichment Tool

A Node.js tool to enrich vocabulary words in the app_words table with:
1. Short, engaging definitions (5-12 words)
2. OWAD-style phrases for more engaging user experience
3. High-quality distractors for vocabulary assessment

## Features

- **Automated Processing**: Fully automated solution for processing large word datasets
- **Batched Processing**: Process words in manageable batches to stay within API limits
- **Resume Capability**: Can resume from where it left off if interrupted
- **Error Handling**: Robust error handling with automatic retries
- **Progress Tracking**: Detailed logging and progress reporting
- **Configurable**: Command-line options for customizing behavior

## Prerequisites

- Node.js v18+ installed
- Access to Supabase database with app_words table
- Google AI Studio API key

## Installation

1. Navigate to the project root directory
2. Install dependencies:

```bash
npm install axios dotenv @supabase/supabase-js fs-extra
```

## Configuration

The tool uses environment variables for configuration. Make sure these are set in your `.env` file or environment:

```
SUPABASE_URL=https://ipljgsggnbdwaomjfuok.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

The Gemini API key is configured in `config.js`.

## Usage

To run the tool in test mode with a small batch of words:

```bash
node word-enrichment/index.js --test
```

To run in production mode for all words:

```bash
node word-enrichment/index.js
```

### Command-line Options

- `--batch-size <n>`: Number of words to process in each batch (default: 25)
- `--resume-from <n>`: Resume processing from a specific offset
- `--status <status>`: Only process words with a specific status
- `--skip-definitions`: Skip generating definitions
- `--skip-owad`: Skip generating OWAD phrases
- `--skip-distractors`: Skip generating distractors
- `--test`: Run in test mode with a small batch
- `--test-batch-size <n>`: Number of words to process in test mode (default: 5)
- `--help`: Show help information

## Output

The tool will:

1. Update the `short_definition` field in the app_words table
2. Update the `owad_phrase` field as a JSON array with two phrases
3. Update the `distractors` field with structured distractor information
4. Set the `definition_updated_at` and `definition_source` fields

## Logs

Log files are saved to the `word-enrichment/logs` directory. Each log entry includes a timestamp and category.

## Temporary Files

Processed batches are saved to `word-enrichment/temp` for backup in case of failure. Progress information is also saved to allow resuming interrupted processing.

## Architecture

- `index.js`: Main entry point and command-line interface
- `config.js`: Configuration and environment settings
- `db.js`: Database operations using Supabase
- `gemini-client.js`: Client for interacting with Google AI Studio API
- `batch-processor.js`: Handles batch processing and coordination
- `generators/`: Contains generators for each type of content
  - `definition-generator.js`: Generates short definitions
  - `owad-generator.js`: Generates OWAD-style phrases
  - `distractor-generator.js`: Generates high-quality distractors
- `utils/`: Utility modules
  - `logger.js`: Logging utilities

## Troubleshooting

If you encounter issues:

1. Check the log files for error messages
2. Verify your API key and database credentials
3. Try running with smaller batch sizes if hitting rate limits
4. Use the `--resume-from` option to skip problematic words

## Performance Considerations

- The free tier of Gemini API has rate limits, so be patient with large datasets
- Processing 68k words will take significant time - plan accordingly
- The tool uses built-in rate limiting to avoid API throttling 