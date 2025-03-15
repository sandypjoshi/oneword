# OneWord App Database Schema

## Overview

The OneWord App database consists of 9 tables and 8 views with various relationships between them. This document outlines the schema structure, table relationships, and key design aspects.

## Tables

### 1. words
```
                                          Table "public.words"
      Column      |           Type           | Collation | Nullable |              Default              
------------------+--------------------------+-----------+----------+-----------------------------------
 id               | integer                  |           | not null | nextval('words_id_seq'::regclass)
 word             | text                     |           | not null | 
 pos              | text                     |           |          | 
 polysemy         | integer                  |           |          | 
 syllables        | integer                  |           |          | 
 difficulty_score | double precision         |           |          | 
 difficulty_level | text                     |           |          | 
 created_at       | timestamp with time zone |           |          | now()
 definitions      | text[]                   |           |          | 
 examples         | text[]                   |           |          | 
 frequency        | integer                  |           |          | 
 updated_at       | timestamp with time zone |           |          | CURRENT_TIMESTAMP
```
- Primary key: `id`
- Unique constraints: `word`
- Indexes on: `difficulty_level`, `polysemy`, `pos`, `word`, `difficulty_score`, `frequency`
- Referenced by many other tables

### 2. synsets
```
                            Table "public.synsets"
      Column      |           Type           | Collation | Nullable | Default 
------------------+--------------------------+-----------+----------+---------
 id               | text                     |           | not null | 
 definition       | text                     |           | not null | 
 pos              | text                     |           | not null | 
 domain           | text                     |           |          | 
 gloss            | text                     |           |          | 
 lexical_file_num | integer                  |           |          | 
 created_at       | timestamp with time zone |           |          | now()
```
- Primary key: `id`
- Indexes on: `domain`, `lexical_file_num`, `pos`
- Referenced by other tables for semantic relationships

### 3. word_synsets (Junction Table)
```
                                        Table "public.word_synsets"
    Column    |           Type           | Collation | Nullable |                 Default                  
--------------+--------------------------+-----------+----------+------------------------------------------
 id           | integer                  |           | not null | nextval('word_synsets_id_seq'::regclass)
 word         | text                     |           | not null | 
 synset_id    | text                     |           | not null | 
 sense_number | integer                  |           |          | 
 tag_count    | integer                  |           |          | 
 created_at   | timestamp with time zone |           |          | now()
 word_id      | bigint                   |           | not null | 
```
- Primary key: `id`
- Foreign keys: 
  - `word_id` references `words(id)`
  - `synset_id` references `synsets(id)`
- Unique constraint on `(word, synset_id)`
- Connects words to their meanings (synsets)

### 4. daily_words
```
                                          Table "public.daily_words"
      Column      |           Type           | Collation | Nullable |                 Default                 
------------------+--------------------------+-----------+----------+-----------------------------------------
 id               | integer                  |           | not null | nextval('daily_words_id_seq'::regclass)
 date             | date                     |           | not null | 
 word             | text                     |           | not null | 
 difficulty_level | text                     |           | not null | 
 created_at       | timestamp with time zone |           |          | now()
 difficulty_score | numeric(10,6)            |           |          | 
```
- Primary key: `id`
- Foreign key: `word` references `words(word)`
- Unique constraint on `(date, difficulty_level)`
- Tracks words scheduled for each day at different difficulty levels

### 5. relationships
```
                                          Table "public.relationships"
      Column       |           Type           | Collation | Nullable |                  Default                  
-------------------+--------------------------+-----------+----------+-------------------------------------------
 id                | integer                  |           | not null | nextval('relationships_id_seq'::regclass)
 from_synset_id    | text                     |           | not null | 
 to_synset_id      | text                     |           | not null | 
 relationship_type | text                     |           | not null | 
 created_at        | timestamp with time zone |           |          | now()
```
- Primary key: `id`
- Foreign keys:
  - `from_synset_id` references `synsets(id)`
  - `to_synset_id` references `synsets(id)`
- Indexes on relationship components and types
- Stores semantic relationships between synsets (hypernyms, hyponyms, etc.)

### Other Tables
- **word_metadata**: Stores additional metadata about words
- **distractors**: Stores distractor words for quiz options
- **domains**: Stores lexical domains for categorization
- **word_examples**: Stores usage examples for words in specific synsets

## Views

The database includes 8 views that provide different perspectives on the data:

### 1. complete_word_view
```
                   View "public.complete_word_view"
      Column      |       Type       | Collation | Nullable | Default 
------------------+------------------+-----------+----------+---------
 word             | text             |           |          | 
 pos              | text             |           |          | 
 difficulty_level | text             |           |          | 
 difficulty_score | double precision |           |          | 
 polysemy         | integer          |           |          | 
 syllables        | integer          |           |          | 
 definition       | text             |           |          | 
 domain           | text             |           |          | 
 gloss            | text             |           |          | 
 sense_number     | integer          |           |          | 
 tag_count        | integer          |           |          | 
 pronunciation    | text             |           |          | 
 etymology        | text             |           |          | 
 frequency        | double precision |           |          | 
```
**Definition**:
```sql
SELECT w.word,
    w.pos,
    w.difficulty_level,
    w.difficulty_score,
    w.polysemy,
    w.syllables,
    s.definition,
    s.domain,
    s.gloss,
    ws.sense_number,
    ws.tag_count,
    m.pronunciation,
    m.etymology,
    m.frequency
FROM words w
    JOIN word_synsets ws ON w.word = ws.word
    JOIN synsets s ON ws.synset_id = s.id
    LEFT JOIN word_metadata m ON w.word = m.word
ORDER BY w.word, ws.sense_number;
```
This view joins data from words, word_synsets, synsets, and word_metadata to provide comprehensive information about each word and its meanings.

### 2. daily_word_details
```
                   View "public.daily_word_details"
      Column      |       Type       | Collation | Nullable | Default 
------------------+------------------+-----------+----------+---------
 date             | date             |           |          | 
 difficulty_level | text             |           |          | 
 word             | text             |           |          | 
 difficulty_score | double precision |           |          | 
 pos              | text             |           |          | 
 polysemy         | integer          |           |          | 
```
This view provides details about daily words, including their date, difficulty level, and word characteristics.

### 3. Other Views
- **word_antonyms**: Shows words with their antonyms based on relationships
- **word_definitions**: Shows words with their definitions
- **word_hypernyms**: Shows words with their hypernyms (broader terms)
- **word_hyponyms**: Shows words with their hyponyms (narrower terms)
- **word_synonyms**: Shows words with their synonyms based on shared synsets
- **word_with_examples**: Shows words with usage examples

The word_synonyms view is defined as:
```sql
SELECT w1.word,
   w2.word AS synonym,
   s.definition,
   s.pos
FROM word_synsets w1
   JOIN word_synsets w2 ON w1.synset_id = w2.synset_id AND w1.word <> w2.word
   JOIN synsets s ON w1.synset_id = s.id;
```
This view finds synonyms by identifying words that share the same synset (meaning).

## Foreign Key Relationships

```
  table_name   | referenced_table 
---------------+------------------
 word_metadata | words
 word_synsets  | synsets
 word_synsets  | words
 daily_words   | words
 distractors   | words
 relationships | synsets
 relationships | synsets
 word_examples | synsets
 word_examples | words
```

## Key Observations

1. **No Circular References**: The database schema has no circular foreign key references. The relationships form a directed acyclic graph (DAG), which is good for database integrity.

2. **Central Tables**:
   - The `words` table is central, with many tables referencing it
   - The `synsets` table is also important, referenced by `word_synsets`, `relationships`, and `word_examples`

3. **Junction Tables**:
   - `word_synsets` connects words to their meanings
   - Appropriate indexes are in place on foreign key columns

4. **Views for Common Queries**:
   - Views simplify common queries by pre-joining tables
   - Specialized views exist for different semantic relationships (synonyms, antonyms, etc.)
   - The `complete_word_view` provides a comprehensive view of word data from multiple tables

5. **Security**:
   - Row-level security policies are implemented for all tables
   - Public read access is allowed, but modifications are restricted to service roles

6. **Performance Optimizations**:
   - Indexes are defined on frequently queried columns
   - Cascade delete rules are in place to maintain referential integrity
   - Views reduce query complexity for common operations

This schema provides a solid foundation for the OneWord application, with clear relationships between entities and appropriate constraints for data integrity. 