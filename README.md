# OneWord

A vocabulary learning application that presents users with daily words of varying difficulty levels along with definitions, examples, and quizzes.

## Features

- **Daily Words**: Learn a new word every day with its definition, pronunciation, and usage examples
- **Multiple Difficulty Levels**: Choose between beginner, intermediate, and advanced words
- **Comprehensive Word Information**: Detailed definitions, examples, and related words
- **Smart Difficulty Scoring**: Words are automatically scored based on frequency, length, and other factors
- **Modern UI**: Clean, intuitive interface with light/dark mode support

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **State Management**: Zustand
- **Styling**: Custom design system with light/dark mode support

## Project Structure

- `/app`: Main application screens and navigation
- `/components`: Reusable UI components
- `/assets`: Images, fonts, and other static assets
- `/lib`: Utility functions and service integrations
  - `/supabase`: Supabase client and services

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
4. Follow the instructions to open the app on your device or emulator:
   ```
   npm run ios     # for iOS
   npm run android # for Android
   npm run web     # for web
   ```

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Structure

The application uses Supabase as its backend with the following main tables:

- **words**: Core word data including difficulty levels and text content
- **app_words**: Application-facing words with difficulty scores
- **word_definitions**: Definitions for words
- **word_examples**: Example usage of words

## License

This project is proprietary. All rights reserved. 