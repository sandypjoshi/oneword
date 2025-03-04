**This is a living document. Confirm assumptions with the user before implementation.**  

---

## IMPLEMENTATION PLAN
_Last Updated: March 5, 2025_

### Phase 1: Project Setup & Architecture (Week 1)
- [x] Initialize Expo + React Native project
- [x] Set up Supabase backend
  - [x] Create tables: `words`, `daily_words`, `user_progress`, `word_distractors`
  - [x] Set up serverless functions for WordsAPI integration
  - [x] Implement seed function for initial word data (Jan 1 - Mar 3, 2025)
  - [x] Implement daily word updates function
  - [x] Set up automated cron job for daily word updates at midnight UTC
  - [x] Implement enhanced distractor generation for word quizzes
  - [x] Complete SQL migrations for all database tables and functions
  - [x] Test and verify Edge Functions and database operations
  - [x] Implement proper word difficulty classification using multiple metrics
  - [x] Enhance database schema with comprehensive tables and relationships
  - [x] Integrate multiple word APIs (WordsAPI and Twinword) for better data
- [ ] Establish design system architecture
  - [ ] Create design tokens (colors, typography, spacing)
  - [ ] Implement theme provider (light/dark mode)
  - [ ] Build core UI components based on Figma designs
- [ ] Configure state management with Zustand
- [ ] Set up caching strategy for offline support
- [ ] Implement basic navigation structure with Expo Router

### Phase 2: Core Features - MVP (Weeks 2-3)
- [ ] Splash Screen & App Loading
  - [ ] Create visually appealing splash with logo
  - [ ] Implement data preloading logic
  - [ ] Add skeleton loaders for content
- [ ] Home Screen
  - [ ] Daily word display component
  - [ ] Multiple-choice meaning interaction
  - [ ] Word answer feedback (animations, haptics)
  - [ ] 7-day timeline navigation
- [ ] Word Detail View
  - [ ] Complete word information display
  - [ ] Add to favorites functionality
  - [ ] Swipe-to-dismiss gesture
- [ ] Onboarding Flow
  - [ ] Vocabulary level selection
  - [ ] Basic app introduction

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
- [ ] Performance optimization
- [ ] Animation refinement
- [ ] Accessibility improvements
- [ ] Cross-platform testing (iOS/Android)
- [ ] Error state handling
- [ ] Loading state refinements

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
- Deployed Edge Functions for WordsAPI integration:
  - `seedWordsForDateRange`: One-time function to populate words for dates (Jan 1, 2025 - Mar 3, 2025)
  - `addWordForNextDay`: Daily function to add new words for next day
  - Set up scheduled cron job in Supabase to run `addWordForNextDay` function at midnight daily
- WordsAPI Key: 8cc3ff3281msh7ea7e190a1f4805p13cbdejsnb32d65962e66
- Twinword API Key: Added to enhance word associations and improve distractor quality
- Enhanced database schema implemented and migrated (March 5, 2025) with tables:
  - `words`: Comprehensive word information with improved metrics for selection
    - Added quality indicators (definition_count, has_examples as generated columns)
    - Enhanced metrics (difficulty_score, frequency_score, syllable_count)
    - Flexible metadata storage for API-specific data
  - `daily_words`: Restructured for quiz functionality
    - Enhanced options structure
    - Added analytics (impression_count, success_count)
    - Added hint and explanation fields for learning enhancement
  - `user_progress`: Tracks user interactions with words
  - `word_distractors`: Enhanced with source tracking and quality metrics
    - Added semantic similarity scoring
    - Added verification status
    - Improved tracking of usage and success metrics
  - `api_cache`: Added for efficient API response caching
    - Stores responses from multiple APIs (WordsAPI, Twinword)
    - Includes error tracking and cache management
  - `word_relationships`: Added for semantic connections between words
    - Stores relationships like synonym, antonym, association
    - Tracks relationship strength and source
  - `twinword_associations`: Specialized storage for Twinword API data
- Row Level Security implemented for data protection
- Enhanced distractor generation using multiple data sources:
  1. Stored high-quality distractors from the word_distractors table
  2. Alternative definitions from the same word (different meanings)
  3. Definitions from synonyms and antonyms of the word
  4. Twinword API associations for semantically related words
  5. Part-of-speech specific templates based on difficulty level
  6. Quality scoring system to improve distractor selection over time
- Word difficulty classification using multiple metrics:
  1. Word length (shorter words are easier)
  2. Syllable count (fewer syllables are easier)
  3. Word frequency data (when available from WordsAPI)
  4. Part of speech complexity (prepositions and articles are easier than adverbs)
  5. Combined scoring system to determine final difficulty level
- Created SQL functions to support distractor management:
  - `text_similarity`: Calculates similarity between text strings
  - `get_distractors_for_word`: Retrieves distractors for a specific word
  - `get_general_distractors_by_pos`: Gets distractors by part of speech
- Updated SQL functions to call Edge Functions directly:
  - Enhanced `seed_words_for_date_range` and `add_word_for_next_day` functions
  - Added HTTP extension for API calls from SQL functions

### State Management
- Zustand for global state (lightweight, flexible)
- React Query for API data fetching and caching
- AsyncStorage for persistent local storage

### UI & Design System
- Follow Figma designs provided by user
- Component-based architecture with clear separation
- Support for both light/dark mode from initial build
- Design tokens for colors, typography, spacing

### Animation Strategy
- Framer Motion for complex animations
- React Native Animated for simple UI transitions
- Haptic feedback for enhanced UX

### Testing Strategy
- Jest for unit testing
- Detox for E2E testing of critical flows
- Manual testing on both iOS and Android
- TestFlight and Google Play beta for real-world testing

---

## PROGRESS LOG

### March 5, 2025 (Latest Update)
- Implemented comprehensive database schema enhancements:
  - Redesigned all tables with focused yet complete structures
  - Added specialized tables for caching (api_cache) and relationships (word_relationships)
  - Implemented computed columns for efficiency (definition_count, has_examples)
  - Added robust indices for query performance optimization
  - Migrated successfully with proper dependency handling
  - Enhanced distractor generation with multi-source approach
  - Applied proper Row Level Security policies to all tables
  - Added comprehensive utility functions for database operations
  - Set up update triggers for automatic timestamp management
  - Created specialized functions for usage tracking and success rate calculation
- Integrated Twinword API as a secondary data source:
  - Added to Edge Functions for enhanced word data
  - Implemented specialized storage for Twinword associations
  - Enhanced distractor quality through word relationships
  - Created caching mechanism to minimize API calls
  - Improved semantic relevance of word associations

### March 4, 2025
- Completed testing of Edge Functions and database operations:
  - Verified direct invocation of Edge Functions via curl
  - Successfully added test words for specific dates
  - Confirmed distractors are being generated and stored correctly
  - Validated SQL migrations for all database components
  - Updated project documentation with latest implementation details
- Implemented enhanced distractor generation system for word quizzes:
  - Created `word_distractors` table with indexes and quality scoring
  - Developed multi-strategy approach using WordsAPI and template generation
  - Added SQL functions for similarity checking and retrieving distractors
  - Seeded database with high-quality distractors by part of speech and difficulty
  - Updated Edge Functions to use the enhanced implementation
  - Added distractor database to store and reuse quality distractors over time
- Implemented automated daily word updates using cron-job.org:
  - Configured job to run at midnight UTC every day
  - Set up HTTP POST request to the `addWordForNextDay` Edge Function
  - Successfully tested with verification in the Supabase database
  - Established secure authentication using Bearer token
  - Configured monitoring and failure notifications
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

---

## OPEN QUESTIONS & DECISIONS PENDING

- Caching strategy details (TTL for word data)
- Specific animation patterns for transitions
- Design system component list based on Figma
- ~~How to generate high-quality wrong options for quizzes, beyond hardcoded mock data~~

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
- Tables: `words`, `daily_words`, `user_progress`, `word_distractors`.
- Edge Functions implemented for WordsAPI integration
- Each date is assigned a word for each level (beginner, intermediate, advanced)
- Words are properly classified by difficulty using a multi-metric scoring system
- seedWordsForDateRange function has populated words for dates from Jan 1 2025 to March 3 2025
- addWordForNextDay function will add a new word each day at midnight
- Enhanced distractor generation ensures high-quality quiz options
- SQL migrations completed for all database components
- Preload 7 days of words at launch; cache data to minimize API calls.  

#### **State Management**  
- Use React Native state management (e.g., Zustand, Redux, Context API) for UI interactions.  
- Observe Supabase data via hooks or subscriptions.  

#### **Animations**  
- Shake for wrong answers, smooth transitions for date navigation.  
- Use Framer Motion for performant animations.  

#### **Error Handling**  
- Show "Offline" banner if no internet; skip invalid word data.  
- Implement retry mechanisms for failed API requests.  

#### **Platform Considerations**  
- Ensure cross-platform compatibility for iOS and Android.  
- Use react-native-gesture-handler for swipe interactions.  
- Implement native push notifications (expo-notifications or Firebase).  
- Dynamic theming support (light/dark mode).

