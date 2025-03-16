# OneWord - Technical Context

## Technologies & Dependencies

### Backend 
- **Node.js**: Server-side JavaScript runtime
- **Supabase**: PostgreSQL database with real-time functionality
- **Gemini API**: Google's AI model for content generation
- **ANSI Colors**: Terminal styling for dashboard UI

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

### Process Configuration
```javascript
// Key configuration parameters
BATCH_SIZE: 40,             // Words per batch
BATCH_PROCESSING_DELAY: 1000, // Delay between batches (ms)
REQUESTS_PER_MINUTE: 16,    // Max requests per minute per key
HOURLY_QUOTA: 900,          // Max requests per hour per key
DAILY_QUOTA: 1800,          // Max requests per day per key
ENABLE_KEY_ROTATION: true,  // Whether to rotate between keys
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