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
- **Backend**: Supabase (Planned - PostgreSQL database, authentication, storage)
- **State Management**: Zustand
- **Styling**: Custom design system with light/dark mode support

## Project Structure

- `/app`: Main application screens and navigation
- `/src`: Source code (components, hooks, services, store, theme, types, utils)
- `/assets`: Images, fonts, and other static assets

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

### Environment Setup (Planned)

Once Supabase is integrated, a `.env` file will be required with:

```
EXPO_PUBLIC_SUPABASE_URL=your_new_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_new_supabase_anon_key
```

## Database Structure (Planned)

The application will use Supabase as its backend. The planned schema includes tables for words, user profiles, progress tracking, and daily schedules. Refer to the development plan for details.

## License

This project is proprietary. All rights reserved. 