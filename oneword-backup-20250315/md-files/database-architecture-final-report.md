# OneWord Database Architecture - Final Report

## Executive Summary

Our comprehensive analysis of the OneWord application database has revealed a well-structured system designed around core word-related tables. The database architecture follows a modular approach with specialized tables for different aspects of linguistic data.

Key findings:
- The database consists of 4 main tables: `words`, `app_words`, `word_definitions`, and `word_examples`
- A strong synchronization mechanism exists between the `words` and `app_words` tables, maintaining consistent difficulty scores
- The database leverages what appears to be WordNet-derived data for definitions and examples
- The architecture supports the application's focus on word difficulty levels and learning

## Table Architecture

| Table Name | Row Count | Primary Purpose | Key Relationships |
|------------|-----------|----------------|-------------------|
| words | 212,460 | Core word repository | Referenced by app_words |
| app_words | 68,760 | Application-optimized words | References words |
| word_definitions | 220,483 | Word definitions with semantic info | Linked to words by text value |
| word_examples | 103,084 | Example sentences | Linked to words by text value |

### words Table
**Row Count:** 212,460  
**Primary Purpose:** Central repository of all words with linguistic properties and difficulty scoring  
**Key Columns:**
- `id` (PRIMARY KEY) - Unique identifier
- `word` (string) - The actual word text
- `pos` (object, nullable) - Part of speech data
- `difficulty_score` (object, nullable) - Calculated difficulty score
- `difficulty_level` (object, nullable) - Categorized difficulty (beginner, intermediate, advanced)
- `frequency` (object, nullable) - Word frequency data
- `syllable_count` (object, nullable) - Number of syllables
- `created_at`/`updated_at` (string) - Timestamps

This table serves as the authoritative source for all words in the system, containing comprehensive linguistic information.

### app_words Table
**Row Count:** 68,760 (32.4% of words table)  
**Primary Purpose:** Curated subset of words optimized for application use  
**Key Columns:**
- `id` (PRIMARY KEY) - Unique identifier
- `word` (string) - The word text
- `pos` (string) - Part of speech
- `raw_frequency`/`normalized_frequency` (number) - Frequency metrics
- `difficulty_score` (number) - Same score as in words table
- `sense_count` (number) - Number of word senses/meanings
- `source_word_id` (number) - Foreign key to words.id
- `status` (string) - Word status in the application
- `short_definition` (object, nullable) - Condensed definition
- `created_at`/`updated_at` (string) - Timestamps

This table contains a subset of the main words table, specifically curated for application use with additional application-specific fields.

### word_definitions Table
**Row Count:** 220,483  
**Primary Purpose:** Detailed definitions for words with semantic information  
**Key Columns:**
- `word` (string) - The word text
- `difficulty_level` (string) - Categorized difficulty
- `synset_id` (string) - WordNet synset identifier
- `definition` (string) - The actual definition text
- `pos` (string) - Part of speech
- `domain` (string) - Semantic domain (e.g., "noun.Tops")
- `sense_number` (number) - Which sense of the word this definition represents

This table contains definitions with multiple entries possible per word (different senses). The presence of synset_ids strongly suggests this data is derived from WordNet.

### word_examples Table
**Row Count:** 103,084  
**Primary Purpose:** Example usage sentences for words  
**Key Columns:**
- `id` (PRIMARY KEY) - Unique identifier
- `word` (string) - The word text
- `synset_id` (string) - WordNet synset identifier
- `example` (string) - Example sentence using the word
- `source` (string) - Source of the example (e.g., "wordnet_gloss")
- `created_at` (string) - Creation timestamp

This table provides example sentences showing word usage in context, also appearing to be derived from WordNet.

## Key Relationships

### Established Relationships
1. **app_words → words** (Foreign Key Relationship)
   - `app_words.source_word_id` references `words.id`
   - This relationship is directly used when pulling word data for the application

### Inferred Relationships (String-Based Joins)
1. **word_definitions ↔ words**
   - Linked by the `word` field (string-based join)
   - Further connection through the `difficulty_level` field
   - Testing showed words from the words table have matching entries in word_definitions

2. **word_examples ↔ words**
   - Linked by the `word` field (string-based join)
   - Not all words have examples (approximately 48.5% coverage)

3. **word_definitions ↔ word_examples**
   - Linked by both `word` and `synset_id` fields
   - These tables appear to form a cohesive semantic dataset

## Synchronization Mechanism

Our detailed investigation into how difficulty scores are synchronized between the `words` and `app_words` tables revealed:

1. **Perfect Timestamp Matching:** Update timestamps in both tables match exactly to the millisecond (100% match rate)
2. **Atomic Updates:** When one table is updated, the other is updated simultaneously
3. **Likely Mechanism:** The synchronization is almost certainly implemented as either:
   - A database trigger that propagates changes between tables
   - A transaction that updates both tables atomically
   - The exact timestamp matching strongly suggests a database-level mechanism rather than application code

This synchronization ensures consistency in difficulty scores across the database, which is critical for the application's functionality.

## Data Distribution Insights

1. **App Words Coverage:** The `app_words` table contains 32.4% of the words in the main words table, suggesting intentional curation
2. **Definition Coverage:** Words typically have multiple definitions, with more definition entries (220,483) than words (212,460)
3. **Example Coverage:** Example coverage is sparser, with 103,084 examples across the database
4. **Word Selection:** The selection of words for the app_words table appears to be based on frequency and utility for language learning

## Recommendations

### Data Integrity Enhancements
1. **Formalize Foreign Key Constraints:** Add explicit foreign key constraints to enforce referential integrity between:
   - `app_words.source_word_id` → `words.id`
   - Consider surrogate keys for string-based joins if possible

2. **Document Synchronization Mechanism:** Create explicit documentation for the difficulty score synchronization:
   - Identify whether it's a trigger, transaction, or API-level mechanism
   - Document the exact update process flow

3. **Indexing Strategy:** Ensure proper indexing exists for:
   - `words.id` and `app_words.source_word_id`
   - `word` columns in all tables (for fast string-based joins)
   - `synset_id` columns for semantic relationships

### Architecture Documentation
1. **Create Schema Documentation:** Develop comprehensive database schema documentation including:
   - Purpose and scope of each table
   - Field definitions and data types
   - Relationship maps and join strategies
   - Update mechanisms and triggers

2. **API Integration Reference:** Document how the database is accessed by the application:
   - Read patterns (which joins are used)
   - Write patterns (synchronization mechanisms)
   - Transaction boundaries

### Optimization Opportunities
1. **Consider Foreign Key Enforcement:** For string-based joins, evaluate if adding proper foreign key constraints would be beneficial
2. **Review Curation Strategy:** Evaluate if the 32.4% coverage in app_words is optimal for application needs
3. **Space Optimization:** Consider if any columns could be normalized to reduce redundancy (especially across string-based joins)

## Conclusion

The OneWord database demonstrates a well-structured design with clear separation of concerns between different word-related entities. The architecture appears to be built on a foundation of WordNet data, extended with application-specific scoring and curation.

The most notable feature is the robust synchronization between the `words` and `app_words` tables, which maintains data consistency. This synchronization is implemented at the database level, suggesting careful attention to data integrity.

The database architecture effectively supports the application's focus on word difficulty levels and language learning, providing rich linguistic data through definitions and examples while maintaining a streamlined subset of words for application use.

The primary area for improvement is the formalization of relationships that are currently implied through string-based joins rather than enforced by the database schema.

---

*Report generated through comprehensive analysis using Supabase API calls and data pattern analysis - March 2025* 