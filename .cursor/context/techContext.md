# OneWord - Technical Context

## Technology Stack

### Frontend
- **Framework**: React Native with Expo SDK
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Storage**: AsyncStorage
- **UI Components**: Custom component library
- **Animation**: React Native Animated
- **Haptics**: Expo Haptics

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Serverless**: Edge Functions
- **Authentication**: Anonymous sessions
- **Storage**: Supabase Storage
- **Scheduling**: pg_cron for scheduled jobs

### External Services
- **Linguistic Data**: WordNet database
- **Word Enrichment**: Datamuse API
- **Monitoring**: Supabase monitoring tools

## Development Environment

### Local Setup
- Node.js v18+
- Expo CLI
- Supabase CLI
- Git for version control
- VS Code with ESLint and Prettier

### Environment Variables
```
SUPABASE_URL=https://ipljgsggnbdwaomjfuok.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODAxMDYsImV4cCI6MjA1NjY1NjEwNn0.Tpqr0Btu0AolHltIv2qa4dLNxd7_wr3eC8NF2oLbGRI
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE
JWT = kldi+d+garOKZjohqVTw4dXjGHbdzAWzqapBmlii5cpaIBWwe943KeVIFjBcGR/9NRafh2O0/mSw/w0C5Pnibg==
DATAMUSE_API_URL=https://api.datamuse.com
```
Gemini_API_Key: AIzaSyDBpCwbZZHBrvC-2hyX3KY7b0c8feHUFvM

### Development Workflow
1. Local development with Expo Go
2. Testing on physical devices
3. CI/CD with GitHub Actions
4. Deployment to Expo EAS

### Administration Scripts
- **update-database.js**: Updates word difficulty scores using configurable thresholds
- **update-thresholds.js**: CLI tool for adjusting difficulty threshold configuration
- **create-difficulty-config.sql**: SQL script to create and initialize difficulty configuration table

## Technical Constraints

### Performance Requirements
- App startup time < 2 seconds
- Screen transition time < 300ms
- API response time < 500ms
- Offline functionality for core features
- Minimal battery usage

### Device Support
- iOS 14+ (iPhone 8 and newer)
- Android API level 26+ (Android 8.0 and newer)
- Minimum screen size: 320x568
- Target screen sizes: iPhone 13/14, Samsung Galaxy S21/S22

### Network Considerations
- Graceful handling of poor connectivity
- Minimal data usage (< 5MB per day)
- Efficient caching strategy
- Background sync for offline changes

### Storage Limitations
- Local storage < 50MB
- Efficient data structures
- Cleanup of old cached data

## Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "react": "18.2.0",
    "react-native": "0.72.3",
    "expo-router": "^2.0.0",
    "zustand": "^4.3.9",
    "expo-haptics": "~12.4.0",
    "@supabase/supabase-js": "^2.31.0",
    "expo-secure-store": "~12.3.0",
    "expo-splash-screen": "~0.20.5",
    "expo-status-bar": "~1.6.0",
    "expo-system-ui": "~2.4.0",
    "react-native-reanimated": "~3.3.0",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.14",
    "typescript": "^5.1.3"
  }
}
```

### Database Schema Dependencies
- WordNet database structure
- Datamuse API response format
- Supabase RLS policies

## API Integrations

### Supabase API
- RESTful API for database operations
- Real-time subscriptions for updates
- Authentication and user management
- Storage for media assets

### Datamuse API
- Word frequency data
- Syllable count information
- Related words (synonyms, antonyms)
- Rate limited to 100,000 requests per day

### WordNet Integration
- Synset relationships
- Word definitions and examples
- Part of speech information
- Semantic relationships

## Security Considerations

### Data Protection
- No personal user data collected
- Device ID for anonymous tracking
- No sensitive information stored

### API Security
- Supabase RLS policies for data access control
- API key rotation schedule
- Rate limiting for public endpoints

### Compliance
- COPPA compliance for educational app
- GDPR considerations for analytics
- Accessibility compliance (WCAG 2.1)

## Testing Strategy

### Unit Testing
- Jest for business logic
- Component testing with React Testing Library

### Integration Testing
- API integration tests
- Database operation tests

### End-to-End Testing
- Detox for critical user flows
- Manual testing on physical devices

### Performance Testing
- Startup time measurement
- Memory usage monitoring
- Battery consumption testing

## Deployment Pipeline

### Development
- Local development with Expo Go
- Pull request previews

### Staging
- EAS Update for OTA updates
- TestFlight/Google Play internal testing

### Production
- App Store and Google Play releases
- Phased rollout strategy
- Monitoring and analytics 