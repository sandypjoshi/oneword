# OneWord

A mobile application that helps users expand their vocabulary by learning one new word each day.

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