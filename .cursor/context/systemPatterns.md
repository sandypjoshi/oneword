# OneWord - System Patterns

## System Architecture

OneWord follows a client-server architecture with the following components:

```mermaid
graph TD
    A[Mobile App - React Native/Expo] --> B[Supabase Backend]
    B --> C[Database]
    B --> D[Edge Functions]
    D --> E[External APIs]
    E --> F[WordsAPI/Datamuse]
    B --> G[Storage]
```

### Client (Mobile App)
- **Framework**: React Native with Expo
- **State Management**: Zustand for global state
- **Navigation**: Expo Router
- **Storage**: AsyncStorage for local caching
- **UI Components**: Custom component library based on design system

### Server (Supabase)
- **Database**: PostgreSQL with custom tables and views
- **Authentication**: Anonymous sessions with device ID tracking
- **Edge Functions**: Serverless functions for word processing
- **Scheduled Jobs**: Cron jobs for daily word selection
- **Storage**: Supabase Storage for media assets

## Key Technical Decisions

### 1. Data-First Approach
- Prioritize data quality and enrichment before feature implementation
- Pre-calculate and store derived data (difficulty scores, distractors)
- Minimize runtime calculations for better performance

### 2. Offline-First Design
- Cache essential data locally for offline functionality
- Implement sync mechanisms for reconnection
- Graceful degradation of features when offline

### 3. Phased Implementation
- Phase 1: Core Linguistic Data Enrichment (Completed)
- Phase 2: Difficulty Calculation & Scoring (Current)
- Phase 3: Distractor Generation (Planned)
- Phase 4: Advanced Educational Features (Planned)

### 4. Optimized Word Selection
- Multi-factor difficulty calculation
- Balanced part-of-speech distribution
- Pre-assignment of daily words

### 5. Scalable Database Design
- Normalized schema for efficient storage
- Denormalized views for query performance
- Proper indexing for common access patterns

## Design Patterns

### Repository Pattern
- Abstract data access through service layers
- Consistent API for both local and remote data
- Centralized error handling and retry logic

```typescript
// Example: WordRepository
class WordRepository {
  async getDailyWord(date: string): Promise<Word> {
    // Try local cache first
    const cached = await this.cache.get(`daily_word_${date}`);
    if (cached) return cached;
    
    // Fetch from API if not cached
    const word = await this.api.fetchDailyWord(date);
    await this.cache.set(`daily_word_${date}`, word);
    return word;
  }
}
```

### Observer Pattern
- React components subscribe to state changes
- Zustand stores publish updates to subscribers
- Efficient re-rendering with minimal overhead

```typescript
// Example: wordStore
const useWordStore = create((set) => ({
  dailyWords: {},
  currentDate: new Date().toISOString().split('T')[0],
  setDailyWord: (date, word) => set((state) => ({
    dailyWords: { ...state.dailyWords, [date]: word }
  })),
  setCurrentDate: (date) => set({ currentDate: date }),
}));
```

### Strategy Pattern
- Pluggable algorithms for word difficulty calculation
- Configurable weights for different factors
- Extensible for future enhancements
- Dynamic threshold application from database configuration

```typescript
// Example: Difficulty Calculator
class DifficultyCalculator {
  constructor(private config: DifficultyConfig, private thresholds: DifficultyThresholds) {}
  
  calculate(word: Word): number {
    const score = (
      this.frequencyScore(word) * this.config.frequencyWeight +
      this.lengthScore(word) * this.config.lengthWeight +
      this.syllableScore(word) * this.config.syllableWeight +
      this.posScore(word) * this.config.posWeight +
      this.domainScore(word) * this.config.domainWeight
    );
    
    return score;
  }
  
  getDifficultyLevel(score: number): DifficultyLevel {
    if (score < this.thresholds.beginner) return 'beginner';
    if (score < this.thresholds.intermediate) return 'intermediate';
    return 'advanced';
  }
}
```

### Factory Pattern
- Create appropriate distractor generators based on word characteristics
- Centralized creation logic with consistent interface
- Extensible for new distractor types

```typescript
// Example: Distractor Factory
class DistractorFactory {
  createGenerator(word: Word): DistractorGenerator {
    if (word.hasAntonyms) return new AntonymDistractorGenerator();
    if (word.hasSynonyms) return new SynonymDistractorGenerator();
    return new SemanticDistractorGenerator();
  }
}
```

## Component Architecture

### Core Components
- **WordCard**: Displays word with pronunciation and part of speech
- **QuizOption**: Interactive button for quiz answers
- **WordDetail**: Comprehensive word information display
- **Timeline**: Horizontal date navigation
- **ChallengeCard**: Container for vocabulary challenges

### Component Relationships
```mermaid
graph TD
    A[App] --> B[HomeScreen]
    A --> C[DetailScreen]
    A --> D[ChallengeScreen]
    B --> E[WordCard]
    B --> F[QuizOptions]
    B --> G[Timeline]
    C --> H[WordDetail]
    D --> I[ChallengeCard]
```

## Database Schema

### Core Tables
- **words**: Primary word information
- **word_definitions**: Word definitions with sources
- **word_examples**: Usage examples
- **word_metadata**: Additional word data (frequency, syllables)
- **daily_words**: Daily word assignments by difficulty level
- **app_word_distractors**: Pre-generated quiz distractors
- **difficulty_config**: Configuration parameters for difficulty thresholds

### Relationships
```mermaid
erDiagram
    words ||--o{ word_definitions : has
    words ||--o{ word_examples : has
    words ||--o{ word_metadata : has
    words ||--o{ daily_words : assigned_to
    words ||--o{ app_word_distractors : has
    daily_words }o--|| difficulty_bands : categorized_by
    difficulty_bands }o--|| difficulty_config : configured_by
```

## API Patterns

### RESTful Endpoints
- GET /daily-words/:date - Retrieve words for specific date
- GET /words/:id/details - Get comprehensive word information
- POST /user-progress - Record user interaction with word

### Data Formats
- Consistent JSON structure for all responses
- ISO date format for temporal data
- Proper error objects with codes and messages

## Error Handling Strategy

### Client-Side
- Graceful UI degradation with fallback content
- Retry mechanisms with exponential backoff
- Informative user feedback for recoverable errors

### Server-Side
- Structured error responses with appropriate HTTP codes
- Detailed logging for debugging
- Fallback mechanisms for external API failures 

# OneWord - System Patterns

## Overview

This document outlines the key architectural patterns and design decisions for the OneWord app, providing a reference for future development.

## Architectural Patterns

### Batch Processing Pattern
The system employs a batch processing pattern for word enrichment:

1. **Fetch**: Retrieve a batch of unprocessed words
2. **Process**: Enrich words with definitions, phrases, distractors
3. **Update**: Store results back to database
4. **Repeat**: Continue with next batch

This pattern allows:
- Efficient database operations (reducing round trips)
- Controlled API usage (respecting rate limits)
- Progress tracking and resumability
- Error isolation (failures limited to current batch)

### API Key Rotation Pattern
The system implements a key rotation pattern to optimize API usage:

1. **Multiple Keys**: Maintain a pool of API keys
2. **Usage Tracking**: Track usage metrics per key
3. **Selection Logic**: Choose least-used key for each request
4. **Rate Limiting**: Enforce quota limits per key
5. **Fallback**: Switch to alternative key when rate limited

Benefits:
- Higher throughput with parallel keys
- Resilience to rate limiting
- Even distribution of load
- Graceful degradation when keys are exhausted

### Checkpoint and Recovery Pattern
The system implements a robust checkpoint and recovery system:

1. **Regular Checkpoints**: Save progress after each batch completion
2. **Stateful Recovery**: Store and restore all accumulated statistics
3. **Offset Tracking**: Record the exact offset for resuming processing
4. **Restart Logic**: Detect and load previous checkpoint on startup
5. **Cleanup**: Remove checkpoint file on successful completion

Benefits:
- Resilience to unexpected process termination
- Ability to stop and restart long-running processes
- No duplicate processing of already completed batches
- Preservation of statistics across restarts

### Error Handling Patterns

#### Exponential Backoff
When encountering rate limits or temporary failures:

1. **Initial Retry**: Wait a short period
2. **Increasing Delay**: Double wait time with each retry
3. **Maximum Retries**: Cap total retry attempts
4. **Jitter**: Add randomness to prevent thundering herd

#### Circuit Breaker
For persistent API failures:

1. **Failure Counting**: Track consecutive failures
2. **Circuit Open**: Temporarily stop requests after threshold
3. **Half-Open**: Test with single request after cooling period
4. **Circuit Close**: Resume normal operation if test succeeds

#### Adaptive Batch Sizing
For handling challenging processing conditions:

1. **Failure Detection**: Monitor batch processing failures
2. **Size Reduction**: Reduce batch size when failures occur
3. **Retry Smaller**: Attempt processing with reduced batch size
4. **Skip Logic**: After multiple failures, log and skip problematic batches
5. **Continuation**: Ensure processing continues past difficult sections

## UI Patterns

### Terminal-Based Dashboard
Design principles for the console dashboard:

1. **Minimal Dependencies**: Use native Node.js features and ANSI colors
2. **Structured Layout**: Organize information in clear sections
3. **Color Coding**: Use colors to highlight different types of information
4. **Keyboard Controls**: Simple single-key commands for operations
5. **Real-time Updates**: Regular refresh of displayed information

Benefits:
- High reliability (fewer dependencies)
- Works in any terminal environment
- Low resource usage
- Clear visual hierarchy

### Carousel Pattern for Word Cards
The app uses a FlatList-based carousel for horizontal swiping between word cards:

```typescript
// app/(tabs)/index.tsx
<FlatList
  ref={flatListRef}
  data={words}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  onViewableItemsChanged={onViewableItemsChanged}
  viewabilityConfig={viewabilityConfig}
  initialNumToRender={3}
  maxToRenderPerBatch={3}
  windowSize={5}
  getItemLayout={getItemLayout}
  contentContainerStyle={styles.carouselContent}
  initialScrollIndex={words.length - 1}
  maintainVisibleContentPosition={{
    minIndexForVisible: 0,
  }}
/>
```

This pattern:
- Provides smooth horizontal swiping between word cards
- Uses pagination indicators to show current position
- Optimizes rendering with virtualization techniques
- Ensures consistent card ordering (oldest→newest, left→right)
- Automatically scrolls to today's word (rightmost) on load

## Data Access Patterns

### Selective Query Pattern
The system queries only necessary data:

1. **Condition-Based Retrieval**: Only fetch words needing processing
2. **Minimal Fields**: Select only required fields for processing
3. **Ordered Access**: Process in consistent ID order
4. **Pagination**: Limit result sets to manageable batches

Benefits:
- Reduced database load
- Improved query performance
- Predictable processing order
- Memory efficiency

### Bulk Update Pattern
For efficient database writes:

1. **Batch Updates**: Aggregate multiple record updates
2. **Upsert Operations**: Use upsert for idempotent operations
3. **Transaction Control**: Ensure atomic batch updates
4. **Progress Tracking**: Record last updated ID for resumability

## Process Control Patterns

### Progressive Enhancement Pattern
Applied to content generation:

1. **Base Content**: Generate essential content first (definitions)
2. **Enhanced Content**: Add additional content (phrases, distractors)
3. **Refinement**: Improve content quality in subsequent passes
4. **Prioritization**: Process most important content types first

### Monitoring and Metrics Pattern
For process visibility:

1. **Key Performance Indicators**: Track processing rate, completion percentage
2. **Resource Usage**: Monitor API call distribution and rate limits
3. **Quality Metrics**: Track error rates and content quality indicators
4. **Time Estimates**: Calculate and display progress projections

### Secure Configuration Pattern
For handling sensitive credentials and configuration:

1. **Environment Variables**: Store sensitive values in environment variables
2. **Masked Values**: Display masked versions of keys in logs and console
3. **Configuration Hierarchy**: Load from environment, then fallback to defaults
4. **Validation**: Verify required values are present and valid before starting
5. **Separation**: Keep configuration separate from application code

## Theme Management

### Theme Provider
The application uses a custom ThemeProvider that wraps the entire application and provides theme values to all components through React Context.

```typescript
// ThemeProvider.tsx
import React, { createContext, useContext } from 'react';
import { theme } from './theme';

const ThemeContext = createContext(theme);

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};
```

### Theme Ready Hook
To handle theme loading and prevent rendering components before the theme is ready, we use a `useThemeReady` hook:

```typescript
// useThemeReady.ts
import { useState, useEffect } from 'react';
import { useTheme } from '../theme';

export default function useThemeReady() {
  const theme = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure all theme properties are available
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return { isReady, theme };
}
```

This pattern ensures components don't render before the theme is fully loaded, preventing undefined theme property errors.

### Theme Usage in Components
Components should use the `useThemeReady` hook to access the theme and check if it's ready before rendering:

```typescript
// ExampleComponent.tsx
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useThemeReady } from '../hooks';

export default function ExampleComponent() {
  const { isReady, theme } = useThemeReady();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { colors } = theme;

  return (
    <View style={{ backgroundColor: colors.background.primary }}>
      {/* Component content */}
    </View>
  );
}
```

### Theme Safety
To prevent errors when theme properties are accessed before they're ready, the `useTheme` hook includes safety checks and default values:

```typescript
export const useTheme = () => {
  const themeContext = useContext(ThemeContext);
  
  // Default theme as fallback
  const safeTheme = {
    colors: {
      background: {
        primary: '#FFFFFF',
        secondary: '#F5F5F5',
      },
      text: {
        primary: '#000000',
        secondary: '#757575',
      },
      // Other default values...
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    // Other theme properties...
  };

  return themeContext || safeTheme;
};
```

This ensures that even if the theme context is not available, components won't break due to undefined theme properties.

### AppState Theme Tracking Pattern
The application uses AppState tracking to update the theme when the app returns to the foreground:

```typescript
// src/theme/ThemeProvider.tsx
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(defaultTheme);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  
  // Listen for app state changes to detect theme changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);
  
  // Update when device color scheme changes or when app comes to foreground
  useEffect(() => {
    // Force re-render when app comes back to active state
    if (appState === 'active' && mode === 'system') {
      // Re-apply the current mode to force context update
      setMode(current => current);
    }
  }, [deviceColorScheme, appState, mode]);
  
  // ... rest of the provider
}
```

This pattern:
- Detects system theme changes while the app is in the background
- Updates the theme when the app returns to the foreground
- Ensures the app always reflects the current system theme preference

## Gesture-Based Navigation

### SwipeableWordCard Pattern
The application uses swipe gestures for navigating between content items. This pattern is implemented in the SwipeableWordCard component:

```typescript
const SwipeableWordCard: React.FC<SwipeableWordCardProps> = ({
  currentWord,
  hasPreviousWord,
  hasNextWord,
  onPrevious,
  onNext,
  style
}) => {
  // Animation value for the horizontal translation
  const position = useRef(new Animated.Value(0)).current;
  
  // PanResponder for handling swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        // Add resistance when swiping beyond bounds
        let newPosition = gesture.dx;
        if ((!hasPreviousWord && gesture.dx > 0) || 
            (!hasNextWord && gesture.dx < 0)) {
          newPosition = gesture.dx / 3; // Resistance effect
        }
        position.setValue(newPosition);
      },
      onPanResponderRelease: (_, gesture) => {
        // Handle swipe completion based on threshold
        if (gesture.dx > THRESHOLD) {
          swipeToPrevious();
        } else if (gesture.dx < -THRESHOLD) {
          swipeToNext();
        } else {
          resetPosition();
        }
      }
    })
  ).current;
  
  // Render with animation transforms
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: position },
            { rotate }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Content */}
    </Animated.View>
  );
};
```

Key aspects of this pattern:
1. **Gesture Recognition**: Using PanResponder to capture and interpret touch gestures
2. **Animation Integration**: Connecting gesture data to Animated values
3. **Boundary Handling**: Adding resistance effect when swiping beyond available content
4. **Threshold-Based Actions**: Triggering navigation only when gesture exceeds threshold
5. **Visual Feedback**: Providing subtle rotation and opacity effects during gestures

This pattern can be adapted for various content types that benefit from swipe-based navigation.

## Synchronized Components

### DateSelector and ContentViewer Synchronization
The application maintains synchronization between selection UI (DateSelector) and content display (SwipeableWordCard):

```typescript
// Parent component manages shared state
const [selectedDate, setSelectedDate] = useState('');
const [currentWord, setCurrentWord] = useState(undefined);

// Selection handler updates the state
const handleDateSelected = (date) => {
  setSelectedDate(date);
};

// Content navigation updates the selection
const handlePrevious = () => {
  const currentIndex = availableDates.indexOf(selectedDate);
  if (currentIndex < availableDates.length - 1) {
    setSelectedDate(availableDates[currentIndex + 1]);
  }
};

return (
  <>
    <DateSelector
      selectedDate={selectedDate}
      onDateSelected={handleDateSelected}
    />
    
    <SwipeableWordCard
      currentWord={currentWord}
      onPrevious={handlePrevious}
      onNext={handleNext}
    />
  </>
);
```

This pattern ensures:
1. **Bidirectional Updates**: Changes in either component reflect in the other
2. **Single Source of Truth**: The parent component manages the shared state
3. **Decoupled Components**: Each component manages its specific functionality
4. **Consistent User Experience**: The UI remains synchronized regardless of interaction method

This pattern is useful whenever multiple UI elements need to reflect the same underlying state.

## Project Structure

### Directory Organization
The application follows a structured organization pattern:

```
/src
  /assets            # Static assets
    /images          # App icons and images
    /fonts           # Typography assets
    /icons           # SVG icons
  /components        # UI components
    /ui              # Basic UI elements (Button, Text, Card)
    /layout          # Layout components (Box, Container)
    /today           # Feature-specific components
    /forms           # Form-related components
    index.ts         # Aggregated exports
  /features          # Feature modules
    /word-of-day     # Word of the Day feature
  /hooks             # Custom React hooks
  /navigation        # Navigation configuration
  /services          # Data services
  /theme             # Theming system
  /types             # TypeScript type definitions
  /utils             # Utility functions
```

This structure provides several benefits:
1. **Separation of Concerns**: Each directory has a clear purpose
2. **Discoverability**: Easy to find components and assets
3. **Scalability**: New features can be added in a consistent way
4. **Maintainability**: Related code is grouped together

### Component Organization
Components are organized by type and feature:

1. **UI Components**: Basic building blocks (Button, Text, Card)
2. **Layout Components**: Structural elements (Box, Container)
3. **Feature Components**: Components specific to a feature (DateSelector, WordCard)

Each component follows a consistent pattern:
- Default export for the component
- Named exports for related utilities
- Index files for easy imports

### Asset Management
Assets are organized by type:

1. **Images**: App icons and static images
2. **Fonts**: Typography assets
3. **Icons**: SVG icons for UI elements

All assets are referenced from their location in the src/assets directory, ensuring consistency across the application.

## Navigation Patterns

### Root Stack Navigator Pattern
The app uses Expo Router with a Stack navigator at the root level for smooth transitions between major screens:

```typescript
// app/_layout.tsx
return (
  <ThemeProvider defaultTheme="system">
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      
      {/* Stack for animated transitions */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        <Slot />
      </Stack>
    </View>
  </ThemeProvider>
);
```

This pattern:
- Provides smooth slide animations between major screens
- Maintains navigation state during transitions
- Allows animation customization through parameters
