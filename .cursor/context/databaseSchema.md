# OneWord Database Schema Documentation

## Last Updated: March 15, 2025

This document provides a comprehensive overview of the OneWord application's database schema, including tables, relationships, and key fields.

## Core Tables

| Table Name | Description | Primary Key | Row Count |
|------------|-------------|-------------|-----------|
| `words` | Core table containing all words with their properties | `word` | ~212,460 |
| `app_words` | Application-facing table with difficulty scores | `word` | ~212,460 |
| `word_definitions` | Definitions for words | (`word`, `synset_id`) | ~220,483 |
| `word_examples` | Example usages for words | `id` | ~103,084 |

## Table Schemas

### words

The core table containing all words and their properties.

| Column | Type | Description |
|--------|------|-------------|
| `word` | text | Primary key, the actual word |
| `difficulty_level` | integer | Calculated difficulty level (1-10) |
| `frequency_score` | numeric | Word frequency score (lower is more common) |
| `length_score` | numeric | Score based on word length |
| `complexity_score` | numeric | Combined complexity score |
| `updated_at` | timestamp | Last update timestamp |

### app_words

Application-facing table with a subset of words used in the application.

| Column | Type | Description |
|--------|------|-------------|
| `word` | text | Primary key, references words.word |
| `difficulty_level` | integer | Difficulty level used in the app (1-10) |
| `updated_at` | timestamp | Last update timestamp |

### word_definitions

Contains definitions for words.

| Column | Type | Description |
|--------|------|-------------|
| `word` | text | The word being defined, part of composite key |
| `synset_id` | text | WordNet synset ID, part of composite key |
| `definition` | text | The actual definition |
| `pos` | text | Part of speech |
| `domain` | text | Domain/category of the word |
| `difficulty_level` | integer | Definition difficulty level |
| `sense_number` | integer | Sense number within the synset |

### word_examples

Contains example usages for words.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `word` | text | The word being exemplified |
| `synset_id` | text | WordNet synset ID |
| `example` | text | The example sentence or phrase |
| `source` | text | Source of the example |
| `created_at` | timestamp | Creation timestamp |

## Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| `words.word` → `app_words.word` | One-to-One | Each word in `words` has a corresponding entry in `app_words` |
| `words.word` → `word_definitions.word` | One-to-Many | Each word can have multiple definitions |
| `words.word` → `word_examples.word` | One-to-Many | Each word can have multiple examples |
| (`word_definitions.word`, `word_definitions.synset_id`) → `word_examples` | One-to-Many | Each definition (word+synset combination) can have multiple examples |

## Synchronization Mechanism

The `words` and `app_words` tables maintain synchronized difficulty scores through one of the following mechanisms:

1. Database-level transactions that update both tables atomically
2. Database triggers that automatically update one table when the other changes
3. Application code that ensures both tables are updated simultaneously

Exact timestamp matching between corresponding records in both tables suggests a robust synchronization process.

## Key Fields for Joining Tables

- `word`: Present in all tables, primary method for joining
- `synset_id`: Used to connect specific word senses between `word_definitions` and `word_examples`

## Data Integrity Observations

1. **Difficulty Scores**: Consistent between `words` and `app_words` tables
2. **Word Coverage**: Complete overlap between `words` and `app_words`
3. **Definition Coverage**: Many words have multiple definitions
4. **Example Coverage**: Fewer examples than definitions, not all words have examples

## Database Usage Patterns

- **Read-heavy access**: The application primarily reads from these tables
- **Batch updates**: Difficulty scores appear to be updated in batches
- **No frequent writes**: No evidence of frequent individual record updates

## Database Management

The application connects to the database using Supabase, with client configuration stored in environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 