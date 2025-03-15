# OneWord

OneWord is a vocabulary learning application that presents users with daily words of varying difficulty levels along with definitions, examples, and quizzes.

## Project Structure

This project has been cleaned up to include only essential files for the application:

```
oneword/
├── .cursor/              # Development context and memory for the project
├── .env                  # Environment variables
├── app/                  # React Native application screens
│   ├── _layout.tsx       # App layout
│   └── index.tsx         # Main screen
├── assets/               # Images, fonts, and other static assets
├── components/           # Reusable React components
├── lib/                  # Library functions and utilities
├── src/                  # Source code
│   └── theme/            # Styling and theme configuration
├── store/                # State management
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── global.js             # Global variables
├── index.js              # Entry point
├── metro.config.js       # Metro bundler configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Use the Expo Go app on your mobile device to scan the QR code, or run on iOS/Android simulators:
   ```
   npm run ios
   npm run android
   ```

## Database Structure

The application uses Supabase as its backend and relies on the following main tables:

- **words**: Central repository of all words with linguistic properties
- **app_words**: Curated subset of words optimized for application use
- **synsets**: Contains word definitions and semantic information
- **word_synsets**: Connects words to their meanings (synsets)
- **word_examples**: Example sentences showing word usage

Plus supporting tables for domains, relationships, and configuration.

## Features

- Daily words at different difficulty levels (beginner, intermediate, advanced)
- Comprehensive word information (definitions, examples, part of speech)
- Related words (synonyms, antonyms, hypernyms, hyponyms)
- Difficulty scoring based on multiple factors
- Modern UI designed for an optimal learning experience

## Environment Variables

Create a `.env` file with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## License

This project is private and proprietary. 