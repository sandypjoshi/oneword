# OneWord Distractor Generation System

## Overview

The OneWord app includes a sophisticated distractor generation system that creates high-quality incorrect options for word definition quizzes. This system combines linguistic knowledge from WordNet with real-time language data from the Datamuse API to create plausible but incorrect definitions that effectively test vocabulary knowledge.

## Architecture

### Key Components

1. **Database Schema**
   - `word_distractors` table for storing and reusing generated distractors
   - Tracking system for distractor quality and usage
   - SQL functions for sibling synset retrieval from WordNet

2. **Edge Function**
   - `generate-distractors` Supabase Edge Function
   - Multi-strategy implementation with fallbacks
   - Caching and rate limiting for external API calls

3. **WordNet Integration**
   - Custom SQL functions for retrieving semantically related words
   - Leverages our existing WordNet database (117,597 synsets)

4. **Datamuse API Integration**
   - Multiple query strategies for related words
   - Advanced caching to minimize API calls

## Distractor Generation Strategies

The system employs a hierarchical approach to ensure both quality and diversity in generated distractors:

### 1. Semantic Network Distraction (WordNet-based)

Retrieves definitions from words that are semantically related to the target word:

- **Sibling Terms**: Words that share the same hypernym (parent concept)
  ```sql
  -- Example: Finding siblings of "oak" might return "maple," "pine," etc.
  SELECT ... FROM words WHERE synset_id IN (
    SELECT synset_id FROM relationships 
    WHERE relationship_type = 'hypernym' 
    AND from_synset_id IN (SELECT synset_id FROM word_synsets WHERE word = 'oak')
  )
  ```

- **Similar Part of Speech**: Words with the same grammatical role but different meanings
  ```sql
  -- Example: For a noun like "bank," find other unrelated nouns
  SELECT ... FROM words w
  JOIN synsets s ON w.synset_id = s.id
  WHERE s.pos = 'n' AND w.word != 'bank'
  ```

This strategy leverages our existing WordNet data to provide semantically coherent distractors.

### 2. Datamuse API Semantic Strategies

Uses the Datamuse API to find words that are semantically related in different ways:

- **Meaning Like (`ml` parameter)**: Words with similar meanings
  ```typescript
  // Example: For "happy" → "joyful," "content," "pleased"
  callDatamuseApi({ 'ml': 'happy', 'md': 'dp', 'max': 15 })
  ```

- **Related Words by POS**: Words related to the target with the same part of speech
  ```typescript
  // Example: For adjective "happy" → other related adjectives
  callDatamuseApi({ 'rel_jjb': 'happy', 'md': 'dp', 'max': 15 })
  ```

### 3. Phonetic Similarity (Datamuse API)

Creates distractors based on sound-alike words, which research shows are particularly effective:

- **Sounds Like (`sl` parameter)**: Words that sound similar
  ```typescript
  // Example: For "principle" → "principal" 
  callDatamuseApi({ 'sl': 'principle', 'md': 'dp', 'max': 10 })
  ```

- **Similar Spelling (`sp` parameter)**: Words with similar spelling
  ```typescript
  // Example: For "desert" → "dessert"
  callDatamuseApi({ 'sp': 'desert', 'md': 'dp', 'max': 10 })
  ```

- **Rhyming Words (`rel_rhy` parameter)**: Words that rhyme
  ```typescript
  // Example: For "height" → "bite," "kite," "site"
  callDatamuseApi({ 'rel_rhy': 'height', 'md': 'dp', 'max': 8 })
  ```

### 4. Definition Transformation

As a last resort when other methods don't yield enough results:

- **Scope Change**: Modifying qualifiers in the correct definition
  ```
  Original: "Always occurs in marine environments"
  Transformed: "Sometimes occurs in marine environments"
  ```

- **Negation**: Adding or removing negation
  ```
  Original: "A condition that is treatable"
  Transformed: "A condition that is not treatable"
  ```

- **Domain Shift**: Changing the context domain
  ```
  Original: "Used in science to measure temperature"
  Transformed: "Used in art to measure temperature"
  ```

- **Adjective Swap**: Replacing adjectives with their opposites
  ```
  Original: "A large celestial body"
  Transformed: "A small celestial body"
  ```

## Quality Control

### Scoring System

Distractors are scored on a scale from 0 to 1 based on several factors:

1. **Source Quality**: WordNet and phonetic distractors typically receive higher initial scores
2. **Definition Length**: Definitions with similar length to the correct one score higher
3. **Difficulty Alignment**: Scores are adjusted based on the target difficulty level:
   - Beginner: Prefers more distinct distractors
   - Advanced: Prefers more subtle distinctions

### Selection Algorithm

1. First pass: Select highest-scoring distractor from each source type for diversity
2. Second pass: Fill remaining slots with the highest-scoring distractors
3. Ensure uniqueness and avoid redundancy

### Continuous Improvement

1. **Usage Tracking**: The system tracks which distractors users select
2. **Feedback Loop**: Distractors frequently chosen by users are considered higher quality
3. **Caching**: Successful distractors are stored and reused

## Usage

### Edge Function API

The `generate-distractors` endpoint accepts the following parameters:

```json
{
  "word_id": 123,           // ID of the word (alternative to "word")
  "word": "example",        // Word text (alternative to "word_id")
  "difficulty_level": "intermediate", // Optional, defaults to "intermediate"
  "count": 3                // Optional, number of distractors to generate
}
```

Response format:

```json
{
  "word": "example",
  "word_id": 123,
  "pos": "noun",
  "difficulty_level": "intermediate",
  "correctDefinition": "A representative form or pattern",
  "definitions": [
    {
      "definition": "A representative form or pattern",
      "isCorrect": true
    },
    {
      "definition": "A punishment intended as a warning to others",
      "isCorrect": false,
      "id": 456
    },
    {
      "definition": "A sample shown to make a judgment",
      "isCorrect": false,
      "id": 789
    },
    {
      "definition": "A parallel or similar instance",
      "isCorrect": false,
      "id": 101
    }
  ]
}
```

### Integrating with Frontend

Example of how to use the distractor generation in your frontend code:

```typescript
// Fetch the daily word with distractors
async function fetchWordWithDistractors(date) {
  try {
    // First get the daily word
    const { data: dailyWord } = await supabase
      .from('daily_words')
      .select('word_id, word')
      .eq('date', date)
      .single();
      
    // Then get distractors
    const { data: wordData } = await supabase.functions
      .invoke('generate-distractors', {
        body: { word_id: dailyWord.word_id }
      });
      
    return wordData;
  } catch (error) {
    console.error('Error fetching word with distractors:', error);
    return null;
  }
}

// Handle user selection
async function handleSelection(definition, definitionId) {
  // If user selected an incorrect option, track it to improve quality
  if (definition !== correctDefinition && definitionId) {
    await supabase.rpc('track_distractor_selection', {
      distractor_id: definitionId
    });
  }
  
  // Continue with feedback to user...
}
```

## Performance Considerations

1. **Caching**: The system implements multi-level caching:
   - Database caching of successful distractors
   - In-memory caching of Datamuse API results
   - Cache size management to prevent memory issues

2. **Rate Limiting**: Respects Datamuse API rate limits (1 request per second)

3. **Fallback Mechanisms**: Multiple strategies ensure distractors are always available

4. **Error Handling**: Comprehensive error handling with graceful degradation

## Monitoring and Maintenance

Monitor the effectiveness of the distractor system using:

```sql
-- Distribution of distractor types
SELECT source_type, COUNT(*) as count, AVG(quality_score) as avg_quality
FROM word_distractors
GROUP BY source_type
ORDER BY count DESC;

-- Most effective distractors (frequently selected by users)
SELECT word_id, distractor_definition, selection_count
FROM word_distractors
WHERE selection_count > 0
ORDER BY selection_count DESC
LIMIT 20;
```

## Appendix: Cognitive Science Principles

This implementation draws on research in cognitive linguistics and learning science:

1. **Semantic Network Theory**: Exploits the brain's semantic organization
2. **Phonological Confusion**: Leverages common sound-based errors
3. **Difficulty Progression**: Adapts challenge level to user proficiency
4. **Learning Through Confusion**: Creates productive confusion that enhances retention 