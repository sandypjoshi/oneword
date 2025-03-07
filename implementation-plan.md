# OneWord App Implementation Plan

## Phase 1: WordNet Integration & Database Setup

### Database Preparation
- [x] Create database schema for words, synsets, relationships, distractors
- [x] Set up functions for word selection and distractor generation
- [x] Configure proper indexes for performance optimization
- [x] Verify successful import of 117,597 synsets and 316.7k word-synset mappings

### WordNet Import Status
- [x] Download WordNet 3.1 data files
- [x] Create WordNet parsing script (index.noun, index.verb, etc.)
- [x] Extract words, definitions, examples, and relationships
- [x] Successfully imported:
  - 81,426 noun synsets
  - 13,650 verb synsets
  - 18,877 adjective synsets
  - 3,644 adverb synsets
  - 316.7k total word-synset mappings
- [x] Add lemmatization during import for better word relationships
- [ ] Optimize query performance for word relationship lookups
- [ ] Add additional semantic relationship types (meronyms, holonyms)

### Data Verification
- [x] Verify synset count matches WordNet specifications (117,597 total)
- [x] Confirm word-sense pair count aligns with WordNet (207,016 unique pairs)
- [x] Validate word-synset mapping count (316.7k including synonyms)
- [ ] Test semantic relationship traversal performance
- [ ] Implement monitoring for relationship query times

## Phase 2: Word Difficulty Algorithm

### Difficulty Metrics
- [ ] Implement syllable counting function
- [ ] Calculate polysemy count (number of meanings per word)
- [ ] Extract hierarchy depth from WordNet hypernym relationships
- [ ] Create frequency score calculation (using WordNet data)
- [ ] Design composite difficulty score formula

### Difficulty Classification
- [ ] Create classification logic for beginner/intermediate/advanced
- [ ] Add manual override capability for edge cases
- [ ] Build difficulty distribution analysis tool
- [ ] Ensure balanced word counts across difficulty levels

## Phase 3: Distractor Generation

### WordNet-Based Distractors
- [x] Implement sibling concept extraction (co-hyponyms)
- [x] Create related domain distractor generator
- [x] Build semantic relationship-based distractors
- [ ] Design plausibility scoring algorithm
- [ ] Implement distractor generation using:
  - Hypernym relationships (more general terms)
  - Hyponym relationships (more specific terms)
  - Coordinate terms (shared hypernyms)
  - Domain-specific relationships
  - Part-of-speech specific patterns

### Datamuse Enhancement
- [ ] Integrate Datamuse API for additional relationships
- [ ] Create hybrid distractor generation pipeline
- [ ] Implement caching for API responses
- [ ] Add fallback mechanism for offline operation

### Quality Control
- [ ] Create distractor evaluation metrics
- [ ] Implement filtering for too-similar distractors
- [ ] Add manual review capability for problematic cases
- [ ] Create test suite for distractor quality assessment

## Phase 4: Daily Word Selection

### Seeding Logic
- [ ] Implement algorithm for date-based random seeding
- [ ] Create balanced selection across word types
- [ ] Build topic variation mechanism
- [ ] Implement difficulty progression

### Database Functions
- [ ] Implement `get_word_for_date(date, difficulty)` function
- [ ] Create `get_distractors_for_word(word_id)` function
- [ ] Build `seed_words_for_date_range(start_date, end_date)` function
- [ ] Add caching mechanism for performance

## Phase 5: API & Client Integration

### Edge Functions
- [ ] Create getWordOfTheDay edge function
- [ ] Implement getDifficulties edge function
- [ ] Build getWord edge function for specific words
- [ ] Create getWordHistory edge function

### Client Integration
- [ ] Update client models to match new schema
- [ ] Implement client-side caching
- [ ] Create offline-first data handling
- [ ] Build progressive loading UI

## Phase 6: Additional Features

### Learning Features
- [ ] Implement spaced repetition algorithm
- [ ] Create user progress tracking
- [ ] Build favorites and custom lists
- [ ] Design review mode

### Content Enhancement
- [ ] Add examples from literature
- [ ] Integrate etymological information
- [ ] Add pronunciation guides
- [ ] Create related words exploration

## Timeline & Milestones

1. **Week 1-2**: Database setup & WordNet import
2. **Week 3**: Word difficulty algorithm implementation
3. **Week 4-5**: Distractor generation system
4. **Week 6**: Daily word selection & seeding
5. **Week 7-8**: API development & client integration
6. **Week 9-10**: Testing, refinement & launch preparation

## Technical Considerations

### Performance
- Batch process WordNet import
- Pre-compute difficulty scores
- Generate distractors in advance
- Use indexes for quick lookups

### Scalability
- Design for potential vocabulary expansion
- Implement caching for frequent operations
- Consider serverless function limits

### Maintainability
- Document data flow thoroughly
- Create admin tools for content management
- Implement logging for critical operations

## Success Metrics

- Database contains 10,000+ quality words
- Each word has at least 3 high-quality distractors
- Balanced distribution across difficulty levels
- API response time under 100ms
- Daily word selection shows good variety 