# OneWord

A vocabulary learning application that presents users with daily words of varying difficulty levels along with definitions, examples, and quizzes.

## Features

- **Daily Words**: Learn a new word every day with its definition, pronunciation, and usage examples
- **Multiple Difficulty Levels**: Choose between beginner, intermediate, and advanced words
- **Quiz Format**: Test your understanding with a multiple-choice quiz for each word
- **Favorites**: Save words you want to remember for later review
- **Progress Tracking**: Track your learning progress over time
- **Offline Support**: Access your words even without an internet connection

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **API**: WordsAPI for word definitions and details
- **State Management**: Zustand
- **Styling**: Custom design system with light/dark mode support

## Project Structure

- `/app`: Main application screens and navigation
- `/components`: Reusable UI components
- `/constants`: Theme definitions and app constants
- `/lib`: Utility functions and service integrations
  - `/supabase`: Supabase client, schema, and services
  - `/hooks`: Custom React hooks

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Follow the instructions to open the app on your device or emulator

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_WORDSAPI_KEY=your_wordsapi_key
```

## Database Setup

1. Create a new Supabase project
2. Run the SQL migrations in `lib/supabase/migrations.sql`
3. Set up Edge Functions for word generation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Recent Improvements and Known Issues

### Current Status
- Total words in database: 212,460
- Words with frequency data: 8,199 (3.86%)
- Active development focusing on fixing enrichment process and improving difficulty calculations

### 1. Word Enrichment Process
- **Current Issues**:
  - Edge function timing out with larger batches
  - Limited word eligibility
  - Processing inefficiencies
- **Planned Fixes**:
  - Optimizing edge functions
  - Updating eligibility criteria
  - Implementing better monitoring
  - See [Enrichment Status](docs/enrichment-status.md) for details

### 2. Difficulty Calculation
- **Recent Updates**:
  - Implementing logarithmic frequency normalization
  - Adjusting difficulty thresholds
  - Improving part of speech scoring
- **Current Focus**:
  - Enhancing data quality
  - Refining scoring algorithms
  - Validating difficulty classifications

### 3. Data Quality
- Working on improving word frequency data coverage
- Implementing better monitoring and validation
- Adding comprehensive data quality checks

## Scripts

### Setting Up

Install dependencies:
```bash
npm install
```

### Data Import and Processing

- **Import WordNet Data** (if not already done):
  ```bash
  npm run import-wordnet
  ```

- **Import Word Frequency Data**:
  ```bash
  npm run populate-frequency
  ```

- **Extract and Separate Definitions and Examples**:
  ```bash
  npm run populate-definitions
  ```

### Supabase Functions

After making changes to difficulty calculation or other edge functions:

```bash
cd supabase
supabase functions deploy calculate-word-difficulty
supabase functions deploy select-daily-words
supabase functions deploy generate-distractors
```

### Data Enrichment

- **Run Word Enrichment** (Note: Currently being optimized):
  ```bash
  npm run enrich-words
  ```

- **Check Enrichment Status**:
  ```bash
  npm run check-enrichment
  ```

- **Reset Enrichment Process**:
  ```bash
  npm run reset-enrichment
  ```

### Difficulty Calculation

- **Calculate Word Difficulty**:
  ```bash
  npm run calculate-difficulty
  ```

- **Validate Difficulty Levels**:
  ```bash
  npm run validate-difficulty
  ```

## Database Structure

- **words**: Core word data including difficulty levels and text content
- **word_metadata**: Additional information like frequency, pronunciation, and etymology
- **synsets**: WordNet synset data
- **word_synsets**: Connections between words and their synsets
- **daily_words**: Words selected for specific dates

## Documentation

For more details on specific components:

- [Word Metadata Documentation](docs/word_metadata.md) 