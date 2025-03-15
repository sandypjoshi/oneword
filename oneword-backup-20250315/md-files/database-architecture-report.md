# OneWord Database Architecture Report

## Executive Summary

This report provides a comprehensive analysis of the OneWord application database, focusing on tables, relationships, data integrity, and recommendations for improvement. Our analysis reveals a structured database built around core word-related tables with well-established relationships for managing word difficulty scores, definitions, and examples.

## Database Overview

### Tables Found

| Table Name | Row Count | Primary Purpose |
|------------|-----------|----------------|
| words | 212,460 | Main words repository with linguistic properties and difficulty scores |
| app_words | 68,760 | Curated subset of words optimized for application use |
| word_definitions | 220,483 | Definitions for words with different senses |
| word_examples | 103,084 | Example sentences showing word usage |

The database follows a distributed design pattern where related information about words is stored in specialized tables rather than a monolithic structure. This approach provides flexibility and performance benefits.

## Detailed Table Analysis

### words Table
**Row Count:** 212,460  
**Primary Key:** id  
**Core Fields:**
- id (PRIMARY KEY)
- word (string)
- pos (part of speech, nullable)
- difficulty_score (nullable, numeric)
- difficulty_level (nullable, string)
- frequency (nullable, numeric)
- syllable_count (nullable, numeric)
- created_at (string, timestamp)
- updated_at (string, timestamp)

This table serves as the primary repository for all words in the system, containing linguistic information and difficulty scores.

### app_words Table
**Row Count:** 68,760  
**Primary Key:** id  
**Core Fields:**
- id (PRIMARY KEY)
- word (string)
- pos (string)
- raw_frequency (number)
- normalized_frequency (number)
- difficulty_score (number)
- sense_count (number)
- status (string)
- source_word_id (number) - Links to words.id
- created_at (string, timestamp)
- updated_at (string, timestamp)

This table contains a curated subset (approximately 32.4%) of the main words table, optimized for application use. It maintains a direct relationship with the main words table via the source_word_id field.

### word_definitions Table
**Row Count:** 220,483  
**Key Fields:**
- word (string)
- synset_id (string)
- definition (string)
- pos (string, part of speech)
- difficulty_level (string)
- domain (string)
- sense_number (number)

This table contains definitions for words, with multiple definitions possible per word (multiple senses). It uses a combination of word and synset_id to uniquely identify definitions.

### word_examples Table
**Row Count:** 103,084  
**Primary Key:** id  
**Key Fields:**
- id (PRIMARY KEY)
- word (string)
- synset_id (string)
- example (string)
- source (string)
- created_at (string, timestamp)

This table provides example sentences showing word usage. Words may have multiple examples or none at all, and examples are linked to specific word senses.

## Relationships

### Established Relationships
1. **app_words → words**: A clear relationship exists where app_words.source_word_id references words.id
   - This relationship is used to maintain synchronized difficulty scores between both tables

### Inferred Relationships
1. **word_definitions ↔ words**: Linked by the word field (string-based join)
   - Not enforced by foreign key constraint
   - Our tests showed that word_definitions entries correspond to entries in the words table

2. **word_examples ↔ words**: Linked by the word field (string-based join)
   - Not enforced by foreign key constraint
   - Some words do not have examples

3. **word_definitions ↔ word_examples**: Appear to be linked by both word and synset_id
   - The synset_id field suggests these tables are derived from WordNet or a similar lexical database

## Data Integrity Findings

1. **Consistent Difficulty Scores**: Our tests showed 100% matching difficulty scores between words and app_words tables for sampled records
   - This synchronization happens simultaneously (same timestamp) during updates

2. **Word Coverage**: The app_words table covers approximately 32.4% of the words in the main words table
   - This suggests intentional curation for application purposes

3. **Definition Coverage**: Words typically have one or more definitions in the word_definitions table
   - The word_definitions table has more rows (220,483) than the words table (212,460), indicating multiple definitions per word

4. **Example Coverage**: Not all words have examples in the word_examples table
   - Example coverage is sparser than definition coverage

5. **No Orphaned Records**: Our tests did not find any app_words records that reference non-existent words in the main table

## Recommendations

1. **Foreign Key Constraints**: Consider adding explicit foreign key constraints between tables to enforce referential integrity:
   - app_words.source_word_id → words.id
   - For string-based relationships, consider adding surrogate keys or ensuring data consistency at the application level

2. **Document Synchronization Mechanism**: Document the mechanism that ensures difficulty scores stay synchronized between the words and app_words tables
   - This appears to be happening through transactions or triggers, but is not explicit in the database schema

3. **Indexing Strategy**: Ensure proper indexing is in place for frequently joined fields:
   - words.id and app_words.source_word_id
   - word fields in all tables
   - synset_id fields in definition and example tables

4. **Database Documentation**: Create comprehensive documentation for the database schema, including:
   - Purpose of each table
   - Relationships between tables
   - Data flow for updates (especially difficulty score synchronization)
   - Curation criteria for app_words

5. **Database Evolution Plan**: Consider a plan for:
   - Potentially increasing app_words coverage if needed
   - Managing growth in definition and example tables
   - Versioning or tracking changes to difficulty scores over time

## Conclusion

The OneWord database demonstrates a well-structured design with clear separation of concerns between different word-related entities. The synchronization of difficulty scores between tables suggests careful attention to data consistency. The primary area for improvement is formalizing relationships that are currently implied rather than enforced by the database schema.

The presence of synset_ids and the structure of definition and example tables suggest the database leverages lexical resources like WordNet, while maintaining application-specific data such as difficulty scores.

Overall, the database appears well-designed for its purpose of supporting a word-learning application with difficulty levels, definitions, and examples. 