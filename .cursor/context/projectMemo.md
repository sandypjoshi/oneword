**This is a living document. Confirm assumptions with the user before implementation.**  

---

## IMPLEMENTATION PLAN
_Last Updated: March 19, 2025_

### Phase 1: Project Setup & Architecture (Week 1)
- [x] Initialize Expo + React Native project
- [x] Set up Supabase backend
  - [x] Create tables: `words`, `daily_words`, `user_progress`, `word_distractors`
  - [x] Set up serverless functions for WordsAPI integration
  - [x] Implement seed function for initial word data (Jan 1 - Mar 3, 2025)
  - [x] Implement daily word updates function
  - [x] Set up automated cron job for daily word updates at midnight UTC
  - [x] Implement enhanced distractor generation for word quizzes
- [x] Establish design system architecture
  - [x] Create design tokens (colors, typography, spacing)
  - [x] Implement theme provider (light/dark mode)
  - [x] Build core UI components based on Figma designs
- [x] Configure state management with Zustand
- [ ] Set up caching strategy for offline support
- [x] Implement basic navigation structure with Expo Router
- [x] Optimize project by removing unnecessary dependencies and bloat

### Phase 2: Core Features - MVP (Weeks 2-3)
- [x] Supabase Edge Functions Enhancement
  - [x] Optimize calculate-word-difficulty function with Datamuse API integration
  - [x] Enhance select-daily-words function with part-of-speech balancing
  - [x] Streamline daily-word-assignment function with improved error handling
  - [x] Implement comprehensive caching to reduce API calls
  - [x] Add detailed metrics collection for word difficulty assessment
  - [x] Implement function monitoring and performance verification
- [x] Database Optimization
  - [x] Create metrics storage table for detailed word statistics
  - [ ] Implement convenience views for improved data access:
    - [ ] `word_metrics_view` for comprehensive word data
    - [ ] `daily_words_complete_view` for simplified daily word queries
    - [ ] `difficulty_distribution_view` for analytics
  - [x] Update functions to store and utilize expanded metrics
- [x] Splash Screen & App Loading
  - [x] Create visually appealing splash with logo
  - [x] Implement data preloading logic
  - [x] Add skeleton loaders for content
- [x] Onboarding Flow
  - [x] Vocabulary level selection
  - [x] Basic app introduction
  - [x] Implementation of slide animations
  - [x] Reset functionality for development testing
- [x] Home Screen / Today Tab
  - [x] Daily word display component with FlashList
  - [x] Multiple-choice meaning interaction
  - [x] Word answer feedback (animations, haptics)
  - [x] 7-day timeline navigation
  - [x] Date selector with horizontal scrolling
  - [x] Word card with proper styling and typography
  - [x] Swipeable interactions for word cards
- [ ] Word Detail View
  - [ ] Complete word information display
  - [ ] Add to favorites functionality
  - [ ] Swipe-to-dismiss gesture

### Phase 3: Secondary Features (Weeks 4-5)
- [ ] Challenges Section
  - [ ] Meaning Match game implementation
  - [ ] Synonym/Antonym Sprint challenge
- [ ] Profile & Settings Screen
  - [ ] Stats tracking & display
  - [ ] Notification preferences
  - [ ] App theme settings
- [ ] Offline Mode Enhancements
  - [ ] Robust error handling
  - [ ] Retry mechanisms
  - [ ] Offline banner

### Phase 4: Polish & Optimization (Week 6)
- [x] Performance optimization
  - [x] FlashList implementation for large datasets
  - [x] Memoization patterns to prevent unnecessary rerenders
  - [x] Component extraction for better reusability
- [ ] Animation refinement
- [x] Accessibility improvements
  - [x] Semantic HTML elements
  - [x] Proper ARIA attributes
  - [x] Color contrast verification
- [x] Cross-platform testing (iOS/Android)
- [x] Error state handling
- [x] Loading state refinements

### Phase 5: Testing & Deployment (Week 7)
- [ ] Unit testing core functionality
- [ ] Integration testing
- [ ] Beta deployment
  - [ ] TestFlight setup
  - [ ] Google Play beta setup
- [ ] Feedback collection & iteration
- [ ] Prepare for production release

### Phase 6: Premium Features (Post-MVP)
- [ ] Extended word history (beyond 7 days)
- [ ] Calendar date selection
- [ ] Advanced challenge types
- [ ] Enhanced statistics
- [ ] Subscription integration (RevenueCat/Superwall)

---

## TECHNICAL DECISIONS

### Backend (Supabase)
- Using anonymous sessions for the MVP with no authentication requirement
- Device ID-based user tracking (implemented in `wordService` and `client.ts`)
- Deployed Edge Functions for word selection and management:
  - `calculate-word-difficulty`: Calculates word difficulty using Datamuse API data with weighted metrics
  - `select-daily-words`: Selects words for each difficulty level with part-of-speech balancing
  - `daily-word-assignment`: Automatically assigns words for the next day
  - `generateDailyWords`: Selects words for each difficulty level using WordNet relationships and usage frequency
  - `enrichWordData`: Enhances word data with Datamuse API for additional context and relationships
  - `enrich-words`: Efficiently processes words with Datamuse API to add frequency and syllable count data
  - Set up scheduled cron job in Supabase to run daily word selection at midnight UTC
- Enhanced difficulty calculation using weighted factors:
  - Word frequency (55% weight): Based on Datamuse frequency data
  - Syllable count (15% weight): Normalized by max reasonable syllables
  - Word length (15% weight): Normalized by max reasonable length
  - Part of speech complexity (10% weight): Varies by POS type
  - Domain complexity (5% weight): Based on specialized vocabulary domains
- Word Enrichment Process:
  - Two-phase approach: local eligibility check followed by cloud-based enrichment
  - Continuous background processing via cron-job.org (every 1 minute)
  - Processing ~900 words per hour with 15-word batches
  - Eligibility classification (eligible-word, eligible-phrase, ineligible)
  - Focused on single words for MVP, with phrases deferred for later
- Performance optimizations:
  - Multi-level caching reduces API calls by approximately 80%
  - Intelligent rate limiting respects API constraints
  - Efficient data structures reduce memory usage
  - State tracking for resumable long-running processes
  
### Frontend (React Native)
- FlashList implementation for performance optimization with large datasets
- Memoization patterns (useCallback, useMemo) to prevent unnecessary rerenders
- Component extraction for better reusability
- AppState tracking for foreground/background state handling
- Stack navigator with proper slide animations between screens
- Theme context with safety checks and default values
- useThemeReady hook for consistent theme loading
- Consistent styling patterns across screens
- Custom UI component library with theme integration

### State Management
- Zustand for global state (lightweight, flexible)
  - Implemented `userStore` for managing user preferences and data
  - Implemented `wordStore` for handling daily words and user interactions
- AsyncStorage for persistent local storage

### UI & Design System
- Follow Figma designs provided by user
- Component-based architecture with clear separation
- Support for both light/dark mode from initial build
- Implemented React Context-based theme provider:
  - Automatic light/dark mode detection based on device settings
  - Manual theme switching capability (light, dark, system)
  - Semantic color system with background, text, and brand colors
  - Consistent spacing scale and typography system
- Implemented theme-aware components:
  - `Box`: Layout component with automatic spacing and color support
  - `Text`: Typography component with text variants (h1, body1, etc.)
  - Custom Button and Card components using theme values

### Animation Strategy
- React Native Animated for simple UI transitions
- Haptic feedback for enhanced UX

### Performance Optimization
- Removed unnecessary UI libraries (GlueStack)
- Eliminated CSS and styling bloat
- Reduced dependency count to improve bundle size
- Simplified project structure
- Implemented lean theme context with minimal overhead

### Testing Strategy
- Jest for unit testing
- Detox for E2E testing of critical flows
- Manual testing on both iOS and Android
- TestFlight and Google Play beta for real-world testing

---

## PROGRESS LOG

### March 19, 2024
- Database Restructuring:
  - Created new tables:
    - `app_words`: Core table for word management
    - `word_definitions`: Separated definitions from main table
    - `word_examples`: Isolated example sentences
    - `word_relationships`: For managing word connections
    - `word_processing_status`: Tracks definition generation progress
  - Created views:
    - `v_words_needing_definitions`: Words pending short definitions
    - `v_word_complete_info`: Consolidated word information
    - `v_daily_word_candidates`: Eligible words for daily selection
  - Cleaned up existing tables:
    - Optimized `synsets` table:
      - Removed redundant columns
      - Added proper indexing
      - Enhanced foreign key relationships
    - Standardized column naming conventions
    - Added proper constraints and validations

- Data Cleanup:
  - Cleaned up definitions:
    - Removed HTML artifacts
    - Standardized formatting
    - Fixed encoding issues
    - Removed duplicate entries
  - Sanitized examples:
    - Fixed malformed sentences
    - Removed inappropriate content
    - Standardized punctuation
    - Added source attribution
  - Enhanced word metadata:
    - Verified part of speech tags
    - Updated frequency data
    - Added difficulty scores
    - Validated etymological information

- Word Processing System Implementation:
  - Created state tracking system with `definition-progress.json`
  - Modified batch size to 5000 words
  - Total words to process: 4,126 words
  - Enhanced progress visualization
  - Implemented ordered processing by ID

- Script Enhancements:
  - Updated `prepare-for-definition.js`:
    - Support for larger batches
    - Progress tracking
    - Error handling
  - Modified `process-definitions.sh`:
    - Background processing
    - Shell persistence
    - Resume capabilities

- Completed Today:
  - [x] Database restructuring and new tables
  - [x] View creation for efficient queries
  - [x] Data cleanup and standardization
  - [x] Progress tracking implementation
  - [x] Script enhancements
  - [x] Processing pipeline setup

- Pending Tasks:
  - [ ] Complete word definition processing
  - [ ] Add data validation triggers
  - [ ] Create maintenance procedures
  - [ ] Set up automated backups
  - [ ] Document new database schema
  - [ ] Implement monitoring

- Next Steps:
  - Process remaining words
  - Add database maintenance scripts
  - Set up automated health checks
  - Complete schema documentation

### March 10, 2025
- Implemented and optimized word enrichment process with Datamuse API:
  - Created a two-phase approach for efficient data enrichment:
    - Phase 1: Fast local eligibility check script to classify all words
    - Phase 2: Cloud-based enrichment of eligible words with API integration
  - Implemented comprehensive classification system:
    - Marked all words as "eligible-word", "eligible-phrase", or "ineligible"
    - Added detailed ineligibility reasons for better data quality
  - Developed state tracking for resumable processing:
    - Created `enrichment_state` table to track progress
    - Implemented intelligent checkpoint system for robust processing
  - Set up automated processing with cron-job.org:
    - Configured to run every minute for maximum throughput
    - Processing ~900 words per hour with 15-word batches
  - Optimized database and Edge Function performance:
    - Implemented better query patterns for word retrieval
    - Added detailed performance logging
    - Tuned batch processing for optimal throughput
- Updated difficulty calculation process:
  - Implemented dynamic weight configuration in database
  - Increased frequency weight to 0.55 to prioritize word commonality
  - Added script to maintain weight proportionality
  - Pre-calculated difficulty scores for initial word set
  - Created enhanced monitoring tools for difficulty statistics

### March 9, 2025
- Enhanced and optimized all Supabase Edge Functions:
  - Completely rewrote `calculate-word-difficulty` with Datamuse API integration for more accurate frequency data
  - Enhanced `select-daily-words` with part-of-speech balancing and improved filtering
  - Streamlined `daily-word-assignment` for better error handling
  - Implemented caching system that reduces API calls by approximately 80%
  - Added comprehensive error handling with fallbacks
- Created detailed documentation for all functions:
  - Function capabilities and parameters
  - Deployment and configuration guides
  - Testing procedures and troubleshooting guides
- Updated implementation plan with database optimization tasks:
  - Added plans for metrics storage tables
  - Designed convenience views for improved data access
  - Scheduled function monitoring and verification tasks

### March 8, 2025
- Optimized project to reduce bloat and improve performance:
  - Removed unnecessary dependencies (NativeWind, Tailwind, React Query, etc.)
  - Eliminated unused files and configurations
  - Reduced bundle size by removing external UI libraries
- Implemented a lightweight theme system:
  - Created React Context-based ThemeProvider with light/dark mode support
  - Developed semantic color system with automatic mode switching
  - Created theme-aware components (Box, Text) for consistent styling
  - Added comprehensive documentation for the theme system
- Restructured project for better maintainability:
  - Removed duplicate project folders
  - Simplified global polyfills
  - Organized code into a cleaner folder structure
- Updated home screen to use the new theme components

### March 7, 2025
- Simplified app architecture by removing GlueStack UI
- Created basic UI components using React Native primitives:
  - Implemented Button component with variants (primary, secondary, outline)
  - Implemented Card component with variants (elevated, outlined, filled)
- Set up simple home screen layout to demonstrate component usage
- Removed tab navigation structure for a simplified app flow
- Configured basic React Native styling using StyleSheet
- Updated app layout to use plain React Native components

### March 6, 2025
- Implemented enhanced distractor generation system for word quizzes:
  - Created `word_distractors` table with indexes and quality scoring
  - Developed multi-strategy approach using WordsAPI and template generation
  - Added SQL functions for similarity checking and retrieving distractors
  - Seeded database with high-quality distractors by part of speech and difficulty
  - Updated Edge Functions to use the enhanced implementation
  - Added distractor database to store and reuse quality distractors over time

### March 5, 2025
- Implemented automated daily word updates using cron-job.org:
  - Configured job to run at midnight UTC every day
  - Set up HTTP POST request to the `addWordForNextDay` Edge Function
  - Successfully tested with verification in the Supabase database
  - Established secure authentication using Bearer token
  - Configured monitoring and failure notifications

### March 4, 2025
- Created initial project with Expo
- Established project structure
- Created implementation plan
- Set up design system (colors, typography, spacing)
- Implemented theme provider with light/dark mode support
- Created basic UI components (Text, Container)
- Set up Supabase client structure
- Created WordsAPI integration service
- Implemented Zustand stores for user and word data
- Set up root layout with providers
- Completed Supabase backend implementation:
  - Created database tables: `words`, `daily_words`, `user_progress`, `word_distractors` with indexes and constraints
  - Deployed edge functions: `seedWordsForDateRange` and `addWordForNextDay`
  - Seeded initial word data for Jan 1, 2025 - Mar 3, 2025
  - Implemented SQL migrations
  - Set up Row Level Security policies

### March 15, 2025
- Completed comprehensive project cleanup to streamline codebase:
  - Created comprehensive backup structure:
    - Organized backup directory (`oneword-backup-20250315`) containing all removed files
    - Categorized backup into logical folders (scripts, tests, json-files, etc.)
    - Preserved all historical data for potential future reference
  - Removed non-essential components:
    - Removed test files and test-related utilities
    - Eliminated one-time scripts and temporary data files
    - Removed unused JSON data files, wordnet datasets, and log files
    - Cleared out mcp-supabase and data processing files
  - Database documentation and analysis:
    - Created comprehensive database schema documentation
    - Documented table relationships and synchronization mechanisms
    - Identified and validated data integrity patterns
    - Recorded essential environment variables and connections
  - Project streamlining:
    - Updated README.md with current project information
    - Simplified project to essential components only
    - Verified application functionality after cleanup
    - Migrated documentation to .cursor directory for better organization
  - Identified core project structure:
    - Preserved app/, components/, lib/ and other essential directories
    - Maintained critical configuration files (.env, package.json, tsconfig.json)
    - Ensured all necessary dependencies were retained

---

## OPEN QUESTIONS & DECISIONS PENDING

- Caching strategy details (TTL for word data)
- Specific animation patterns for transitions
- ~~Design system component list based on Figma~~
- ~~How to generate high-quality wrong options for quizzes, beyond hardcoded mock data~~
- Component optimization strategies for large word lists
- ~~Metrics to collect for function monitoring and performance verification~~
- Structure and indexes for the planned metrics storage table
- Query patterns for the database views to optimize

---

### **Core Features & Interactions**  

#### **Splash Screen**  
- Preload data (daily words, user state) from Supabase.  
- Show skeleton loader if data is unavailable.  
- Transition to Home Screen after loading completes.  

#### **Home Screen**  
- **Daily Word Display**  
  - Show word, pronunciation, and part of speech.  
  - Use cached data; show skeleton loader during API fetch.  
- **Daily Check Interaction**  
  - 3-4 tappable buttons with potential meanings.  
  - Wrong answer: Shake animation + change button state + haptic feedback.  
  - Correct answer: Disable other buttons + navigate to Word Detail View after 1.5s.  
- **Date Navigation**  
  - Horizontal timeline (7 days) with swipe gestures.  
  - Calendar dropdown (premium) for date selection.  
  - Selected date and related word should update when the user swipes the page.  

#### **Word Detail View**  
- Display definition, origin, example, synonyms, and antonyms.  
- Include "Add to Favorites" button (updates Supabase).  
- Swipe-to-dismiss or back button navigation.  

#### **Challenges Section**  
- **Meaning Match**: Grid-based game to pair definitions with past words.  
- **Synonym/Antonym Sprint**: Timed 60-second challenge with real-time scoring.  

#### **Profile & Settings**  
- Stats: Learned words, accuracy, streaks.  
- Subscription.  
- Notification settings (schedule daily reminders).  

#### **Onboarding**  
- Vocabulary level selection (stored in settings).  
- Widget setup tutorial (redirect to relevant widget setup screen on Android/iOS).  

---

### **Technical Requirements**  

#### **Backend (Supabase)**  
- Tables: `words`, `daily_words`, `user_progress`, `word_distractors`, `enrichment_state`, `difficulty_configuration`.
- Edge Functions implemented for word selection, management, and enrichment
- Each date is assigned a word for each level (beginner, intermediate, advanced)
- seedWordsForDateRange function has populated words for dates from Jan 1 2025 to March 3 2025
- addWordForNextDay function will add a new word each day at midnight
- enrich-words function continuously processes words to add frequency and syllable data
- Preload 7 days of words at launch; cache data to minimize API calls.  

#### **State Management**  
- Use Zustand for global state management
- Implement React Context for theme management
- Use AsyncStorage for persistent local storage
- Observe Supabase data via hooks

#### **Animations**  
- Use React Native Animated for transitions and animations
- Implement shake animation for wrong answers
- Add smooth transitions for date navigation

#### **Error Handling**  
- Show "Offline" banner if no internet; skip invalid word data.  
- Implement retry mechanisms for failed API requests.  

#### **Platform Considerations**  
- Ensure cross-platform compatibility for iOS and Android.
- Use react-native-gesture-handler for swipe interactions.
- Implement native push notifications (expo-notifications or Firebase).
- Dynamic theming support with ThemeProvider.

---

## **DEVELOPMENT GUIDELINES**

### **UI Component Development**
- **Use theme-aware and custom components**:
  - Access theme values with the `useTheme` hook
  - Use the `Text` component for typography styles
  - Use the `Box` component for layout with theme-aware spacing
  - Utilize custom components in the components/common directory
  - Create new components as needed based on design requirements

- **Proper Component Hierarchy**:
  - Organize components logically in directories
  - Keep related components together
  - Use index files to export components
  - Wrap app with `ThemeProvider` at the root level

- **Component Selection Process**:
  1. Use theme-aware components for basic UI elements
  2. Use custom components from components/common for consistent UI patterns
  3. Create new custom components when needed, following established patterns

- **UI Consistency**:
  - Access theme values through the `useTheme` hook
  - Never hardcode colors or spacing values
  - Follow naming conventions for component props and style properties
  - Maintain consistent prop patterns across similar components
  - Test all components in both light and dark modes

### **Theme System Usage**
- **Color System**:
  - Use semantic color names: `colors.background.primary`, `colors.text.secondary`
  - Access colors through the theme: `const { colors } = useTheme()`
  - Support both light and dark themes for all UI elements

- **Typography System**:
  - Use predefined text variants: `<Text variant="h1">`, `<Text variant="body1">`
  - Apply consistent text styles across the app
  - Avoid using raw `<Text>` components without variants

- **Spacing System**:
  - Use theme spacing values: `spacing.md`, `spacing.lg`
  - Apply consistent spacing through the `Box` component
  - Use semantic spacing props: `padding="md"`, `marginTop="lg"`