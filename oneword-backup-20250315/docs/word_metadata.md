# Word Metadata Table Documentation

The `word_metadata` table is designed to store additional information about words that doesn't fit in the main `words` table. This document explains its structure and proper usage patterns.

## Table Structure

The `word_metadata` table has the following structure:

```sql
CREATE TABLE word_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL REFERENCES words(word),
  pronunciation JSON,       -- IPA and phonetic pronunciation data
  etymology TEXT,           -- Word origin information
  frequency FLOAT,          -- Normalized frequency (0-1 scale)
  zipf_value FLOAT,         -- Zipf frequency value (log10 frequency per billion + 3)
  usage_domains TEXT[],     -- Domains where this word is commonly used
  register TEXT,            -- Formality register (formal, informal, slang, etc.)
  additional_data JSONB,    -- Any other metadata in JSON format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on word column for fast lookups
CREATE INDEX word_metadata_word_idx ON word_metadata(word);
```

## Purpose and Usage

The `word_metadata` table serves several key purposes in the OneWord application:

1. **Enhanced Difficulty Calculation**: Provides frequency data used in calculating word difficulty levels.
2. **Richer Word Information**: Stores pronunciation, etymology, and other details for the learning experience.
3. **Flexible Storage**: The `additional_data` JSONB field allows for storing any additional properties without schema changes.

## Integration Points

The metadata is used in these main functions:

1. **Difficulty Calculation**: The `calculate-word-difficulty` function checks for frequency data in the metadata table when not available in the main words table.

2. **Distractor Generation**: The `generate-distractors` function can use pronunciation data to create phonetically similar distractors.

3. **Word Selection**: The `select-daily-words` function may consider metadata properties when selecting appropriate words.

## How to Populate

There are several scripts for populating different aspects of word metadata:

1. **Frequency Data**: Use `scripts/populate_frequency.ts` which imports SUBTLEX frequency data.

2. **Pronunciation**: (Future improvement) Create a script to extract IPA pronunciations from a dictionary source.

3. **Etymology**: (Future improvement) Create a script to extract etymology data from Wiktionary or similar sources.

## Best Practices

1. **Normalized Frequency**: Always store frequency values on a 0-1 scale, where 1 represents the most common words.

2. **JSON Structure**: For complex fields like pronunciation, use a consistent structure:
   ```json
   {
     "ipa": "/kəmˈpjuːtər/",
     "phonetic": "kuhm-pyoo-ter"
   }
   ```

3. **Updates**: When updating, always use upsert with word as the conflict field to avoid duplicates.

## Example Queries

### Fetch Word with Metadata

```sql
SELECT w.*, wm.pronunciation, wm.frequency, wm.etymology
FROM words w
LEFT JOIN word_metadata wm ON w.word = wm.word
WHERE w.word = 'example';
```

### Update Frequency Data

```sql
INSERT INTO word_metadata (word, frequency, zipf_value)
VALUES ('example', 0.75, 5.21)
ON CONFLICT (word) 
DO UPDATE SET 
  frequency = EXCLUDED.frequency, 
  zipf_value = EXCLUDED.zipf_value,
  updated_at = NOW();
``` 