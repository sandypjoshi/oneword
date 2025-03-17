# OneWord - Technical Context

## Technologies & Dependencies

### Backend 
- **Node.js**: Server-side JavaScript runtime
- **Supabase**: PostgreSQL database with real-time functionality
- **Gemini API**: Google's AI model for content generation
- **ANSI Colors**: Terminal styling for dashboard UI
- **dotenv**: Environment variable management for secure configuration

### Frontend
- **React**: UI library for component-based development
- **React Native**: Cross-platform mobile development

## System Architecture

### Word Enrichment Pipeline
The word enrichment process follows these steps:

1. **Data Retrieval**: Fetch unprocessed words from the database (missing definitions/phrases/distractors)
2. **Definition Generation**: Generate short definitions using Gemini API
3. **OWAD Phrase Generation**: Generate OWAD-style phrase pairs using Gemini API
4. **Distractor Generation**: Generate semantic, antonym, and form-based distractors using Gemini API
5. **Database Update**: Store the enriched word data back to Supabase

### API Key Rotation System
The system employs an optimized key rotation strategy:

1. **Multiple API Keys**: Uses 5 separate Gemini API keys
2. **Round-Robin Rotation**: Distributes requests across available keys
3. **Rate Limiting**: Enforces per-minute, hourly, and daily quotas per key
4. **Backoff Strategy**: Implements exponential backoff for rate-limited keys

### Checkpoint and Recovery System
The system implements a robust checkpoint mechanism:

1. **Checkpoint File**: JSON file storing current processing state
2. **Regular Saving**: Updates checkpoint after each batch completion
3. **Statistics Preservation**: Maintains all counters and statistics
4. **Recovery Process**: Automatically detects and loads checkpoint on restart
5. **Cleanup**: Removes checkpoint file on successful completion

### Processing Dashboard
Terminal-based dashboard for monitoring and control:

1. **ANSI-based UI**: Uses terminal colors and formatting for display
2. **Real-time Statistics**: Shows processing rate, progress, time estimates
3. **Key Controls**: Keyboard shortcuts for start/stop/restart functions
4. **API Monitoring**: Tracks usage per key with rate limit detection

## Data Models

### Word Data Structure
```javascript
{
  id: Number,            // Unique identifier
  word: String,          // The word itself
  pos: String,           // Part of speech
  short_definition: String, // Generated definition
  owad_phrase: Array,    // Generated OWAD-style phrases
  distractors: Object,   // Generated distractors by type
  definition_source: String, // Source of definition (e.g., "gemini")
  definition_updated_at: Date // When definition was last updated
}
```

## Configuration

### Environment Variables
```
# Supabase Configuration
SUPABASE_URL=https://example.supabase.co
SUPABASE_KEY=your-supabase-key

# API Keys (Gemini)
GEMINI_API_KEY_1=your-api-key-1
GEMINI_API_KEY_2=your-api-key-2
GEMINI_API_KEY_3=your-api-key-3
GEMINI_API_KEY_4=your-api-key-4
GEMINI_API_KEY_5=your-api-key-5

# Processing Configuration
BATCH_SIZE=40
BATCH_PROCESSING_DELAY=1000
```

### Process Configuration
```javascript
// Key configuration parameters
BATCH_SIZE: process.env.BATCH_SIZE || 40,             // Words per batch
BATCH_PROCESSING_DELAY: process.env.BATCH_PROCESSING_DELAY || 1000, // Delay between batches (ms)
REQUESTS_PER_MINUTE: 16,    // Max requests per minute per key
HOURLY_QUOTA: 900,          // Max requests per hour per key
DAILY_QUOTA: 1800,          // Max requests per day per key
ENABLE_KEY_ROTATION: true,  // Whether to rotate between keys
MAX_RETRIES: 3,             // Maximum retry attempts for failed batches
```

### Dashboard Options
```javascript
// Main dashboard capabilities
- Process start/stop/restart (keyboard controls)
- Auto-refresh toggle
- Progress visualization
- API key usage statistics
- Current word tracking
- Process output display
```

## Development Tools

- **VS Code**: Primary IDE for development
- **Git**: Version control
- **Cursor**: AI-assisted coding platform

## Error Handling Strategy

1. **Rate Limit Handling**: Automatic detection and key rotation
2. **JSON Parsing Errors**: Robust parsing with fallback mechanisms
3. **Connectivity Issues**: Automatic retry with exponential backoff
4. **Process Interruption**: Progress tracking with resumption capability
5. **Batch Failures**: Adaptive batch size reduction with retry logic
6. **Memory Management**: Node.js memory optimization for large datasets 

## UI Design and Component Structure

### Theme Management
- **ThemeProvider**: Custom React Context provider for theme values
- **useTheme**: Hook for accessing theme values in components
- **useThemeReady**: Hook for safely handling theme loading
- **Default theme values**: Fallback values for theme properties to prevent errors

### Component Structure
- **Layout Components**:
  - `Box`: Flexbox-based layout component with theme integration
  - `Container`: Container with padding and margin support
  - `Screen`: Full-screen component with safe areas

- **UI Components**:
  - `Text`: Typography component with theme and variant support
  - `Button`: Button component with various styles and states
  - `Icon`: SVG-based icon component with Linear and Bold variants
  - `Card`: Container for content blocks with shadow and border radius
  - `WordOfDayCard`: Specialized card for displaying word of the day

### Navigation
- **Tab Navigation**: Bottom tab navigation using expo-router
- **Stack Navigation**: Stack-based navigation for screens
- **Modals**: Modal screens for focused interactions
- **useAppNavigation**: Custom hook for type-safe navigation

### Styling Patterns
- **StyleSheet**: React Native StyleSheet for optimized style objects
- **Theme integration**: Components use theme values for consistent styling
- **Dynamic styles**: Style objects that adapt to theme changes
- **Responsive design**: Flexible layouts that adapt to different screen sizes

### Code Organization
- **Feature-based**: Code organized by feature rather than type
- **Index files**: Export components from index files for easier imports
- **Default exports**: Components use default exports for cleaner imports
- **Type safety**: TypeScript interfaces and types for component props 

## Animation and Gesture Handling

### Animation APIs
- **Animated API**: Core React Native animation system
  - Used for smooth transitions and visual feedback
  - Supports spring, timing, and decay animations
  - Integrates with gesture handling via Animated.Value

### Gesture Handling
- **PanResponder**: System for recognizing and responding to touch gestures
  - Used for swipe-based navigation in Word of Day cards
  - Handles multi-touch gestures and velocity tracking
  - Provides granular control over gesture lifecycle

### Animation Techniques
- **Transform Animations**: Using transform properties for performant animations
- **Interpolation**: Mapping input ranges to output values for complex animations
- **Resistance Effects**: Adding non-linear responses to gestures at boundaries
- **Gesture-Driven Animations**: Connecting pan gestures directly to animated values

## Data Management

### Mock Service Pattern
- **Service Classes**: Encapsulating data operations in service classes
- **Singleton Pattern**: Using singleton instances for services
- **Interface-First Design**: Designing data interfaces before implementation
- **Data Transformation**: Converting backend data to frontend-friendly structures

### Date Handling
- **Date Processing**: Converting between Date objects and ISO strings
- **Relative Dates**: Calculating past dates relative to the current date
- **Date Formatting**: Formatting dates for display in the UI
- **Date Comparisons**: Comparing dates for sorting and filtering 