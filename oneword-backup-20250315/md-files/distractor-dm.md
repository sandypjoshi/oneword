# Datamuse Distractor Generation Strategy

## Overview

This document outlines the strategy for using the Datamuse API to generate high-quality distractors for the OneWord vocabulary app. Distractors are alternative options presented alongside the correct answer in multiple-choice quizzes that are designed to be plausible but incorrect.

## Analysis of Datamuse API

Based on our testing, we've evaluated Datamuse's capabilities for different types of distractor generation:

### 1. Semantic Distractors (Similar Meanings)

**API Parameter:** `ml={word}` (means like)

**Strengths:**
- Provides high-quality semantically related words
- Assigns meaningful relevance scores
- Successfully excludes exact synonyms when filtered
- Generated distractors are plausible and challenging

**Examples:**
- For "tenacious": persistent, resolute, steadfast
- For "ephemeral": fleeting, brief, transitional
- For "ubiquitous": pervasive, prevalent, widespread

**Assessment:** Excellent. The semantic distractors are particularly strong and would make for challenging quiz options.

### 2. Phonetic Distractors (Sound-Alike)

**API Parameter:** `sl={word}` (sounds like)

**Strengths:**
- Returns words that sound similar
- Often finds creative sound-alike options

**Weaknesses:**
- Sometimes returns the original word as the top match
- Often returns derivatives of the original word
- Quality varies widely based on the word

**Examples:**
- For "tenacious": tinnitus, tenisha
- For "ephemeral": ephemoral, femoral
- For "ubiquitous": ubiquity, subaqueous

**Assessment:** Mixed. While useful, careful filtering is needed to remove derivatives of the original word.

### 3. Orthographic Distractors (Similar Spelling)

**API Parameter:** `sp={word}` (spelled like)

**Strengths:**
- Finds words with similar spelling patterns
- Useful for more obscure words

**Weaknesses:**
- Often returns the original word or variations
- Limited results for some words
- Many are morphological variations rather than distinct words

**Examples:**
- For "tenacious": mendacious, veracious
- For "ephemeral": ephemera, ephemeris
- For "ubiquitous": iniquitous, obliquitous

**Assessment:** Moderately useful. Best for specific cases where visual similarity would be confusing.

### 4. Antonyms

**API Parameter:** `rel_ant={word}`

**Weaknesses:**
- Often returns no results
- Limited coverage across vocabulary

**Assessment:** Not reliable as a consistent source of distractors.

## Implementation Strategy

### Primary Approach: Hybrid Distractor Generation

1. **Prioritize Semantic Distractors**
   - Use the semantic relationships (`ml` parameter) as the primary source
   - Filter out actual synonyms using the synonyms list (`rel_syn` parameter)
   - Ensure distractors are not morphological variations of the target word

2. **Supplement with Phonetic and Orthographic Distractors**
   - Add sound-alike words for more challenging quizzes
   - Include visually similar words for advanced difficulty levels
   - Balance the mix based on the target word's difficulty level

3. **Quality Filters**
   - Remove words with the same stem as the target word
   - Filter out words that are too short (< 3 characters)
   - Exclude proper nouns and specialized terminology
   - Ensure distractors are at a similar difficulty level as the target word

### Implementation Pseudocode

```javascript
async function generateQualityDistractors(word, count = 3) {
  // 1. Get synonyms to exclude them from distractors
  const synonyms = await getSynonyms(word);
  const synonymSet = new Set(synonyms.map(s => s.word));
  
  // 2. Get semantic distractors (our primary source)
  const semanticOptions = await getSimilarWords(word, 20);
  let filtered = semanticOptions
    .filter(item => !synonymSet.has(item.word))
    .filter(item => !item.word.startsWith(word) && !word.startsWith(item.word))
    .filter(item => item.word.length > 2)
    .filter(item => !item.word.includes(' ')); // Single words only
  
  // 3. Get sound-alike and similarly spelled words as backup
  let backupOptions = [];
  if (filtered.length < count) {
    const soundAlikes = await getSoundAlikeWords(word, 10);
    const spelledLike = await getSimilarlySpelledWords(word, 10);
    
    backupOptions = [...soundAlikes, ...spelledLike]
      .filter(item => item.word !== word)
      .filter(item => !synonymSet.has(item.word))
      .filter(item => !item.word.includes(word))
      .filter(item => item.word.length > 2);
  }
  
  // 4. Combine and select the best distractors
  const allOptions = [...filtered, ...backupOptions];
  const uniqueOptions = removeDuplicates(allOptions);
  const selectedDistractors = uniqueOptions
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
  
  return selectedDistractors;
}
```

## Distractor Quality Tiers

We can classify distractors into three tiers based on their quality and challenge level:

### Tier 1: High-Quality Semantic Distractors
- Words with similar but distinct meanings
- Example: "tenacious" → "persistent", "resolute", "steadfast"
- Should comprise 60-70% of all distractors

### Tier 2: Sound-Alike and Visual Similarity Distractors
- Words that sound or look similar but have different meanings
- Example: "ephemeral" → "ethereal", "epidermal"
- Should comprise 20-30% of all distractors

### Tier 3: Domain or Context Related Distractors
- Words from the same domain or context but with different meanings
- Example: "ubiquitous" (technology) → "interface", "computing"
- Should comprise 10-20% of all distractors

## Integration with WordNet

The Datamuse API should complement our WordNet database:

1. **Primary Source Hierarchy**
   - First attempt to find distractors in our WordNet database
   - Fall back to Datamuse API when insufficient options are available
   - Cache successful Datamuse distractors to our database

2. **Quality Assurance Process**
   - Use WordNet's semantic relationships to validate Datamuse suggestions
   - Exclude distractors that are too semantically close to the target word
   - Ensure distractors maintain an appropriate difficulty level

3. **Synergy Between Sources**
   - Use WordNet for precise lexical relationships (synonyms, hypernyms)
   - Use Datamuse for broader semantic associations and phonetic similarities
   - Combine both to generate comprehensive distractor sets

## Performance Optimization

To ensure efficient API usage:

1. **Caching Strategy**
   - Cache Datamuse API responses locally
   - Store successful distractors in the database
   - Implement an LRU (Least Recently Used) cache for frequent words

2. **Batch Processing**
   - Generate distractors for multiple words in advance
   - Pre-compute distractors for daily challenge words
   - Process in batches during low-usage periods

3. **Fallback Mechanism**
   - Have pre-generated distractor sets for common words
   - Implement algorithmic fallbacks for API failures
   - Establish minimum quality thresholds

## Example Implementation

```javascript
// distractorService.js

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

// Try to get distractors from database first, then Datamuse
async function getDistractors(word, count = 3) {
  // Check database first
  const { data: storedDistractors } = await supabase
    .from('distractors')
    .select('*')
    .eq('word', word)
    .limit(count);
    
  if (storedDistractors?.length >= count) {
    return storedDistractors;
  }
  
  // Fall back to Datamuse API
  const neededCount = count - (storedDistractors?.length || 0);
  const datamuseDistractors = await generateDatamuseDistractors(word, neededCount);
  
  // Store new distractors in database
  if (datamuseDistractors.length > 0) {
    await supabase.from('distractors').insert(
      datamuseDistractors.map(d => ({
        word,
        distractor: d.word,
        distractor_type: d.type || 'semantic',
        source: 'datamuse',
        score: d.score
      }))
    );
  }
  
  return [...(storedDistractors || []), ...datamuseDistractors];
}
```

## Metrics and Evaluation

To continuously improve distractor quality:

1. **User Performance Tracking**
   - Track which distractors users incorrectly select
   - Identify patterns in effective vs. ineffective distractors
   - Adjust distractor selection algorithms based on data

2. **Quality Scoring System**
   - Develop a composite score for distractor quality
   - Factors: semantic distance, phonetic similarity, selection rate
   - Use scores to prioritize distractors in future quizzes

3. **A/B Testing**
   - Test different distractor generation strategies
   - Compare user learning outcomes
   - Optimize based on engagement and retention metrics

## Conclusion

The Datamuse API provides a valuable complement to our WordNet database for generating high-quality distractors. By primarily leveraging semantic relationships, carefully filtering results, and implementing a tiered approach, we can create challenging and educational vocabulary quizzes that enhance the learning experience in the OneWord app.

This strategy will evolve based on user data and feedback, with the goal of continuously improving the quality and educational value of our vocabulary challenges. 