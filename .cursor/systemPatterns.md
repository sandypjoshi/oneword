# OneWord - System Patterns

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