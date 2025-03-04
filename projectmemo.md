**This is a living document. Confirm assumptions with the user before implementation.**  

---

## IMPLEMENTATION PLAN
_Last Updated: March 6, 2025_

### Phase 1: Project Setup & Architecture (Week 1)
- [x] Initialize Expo + React Native project
- [x] Set up Supabase backend
  - [x] Create tables: `words`, `daily_words`, `user_progress`, `word_distractors`
  - [x] Set up serverless functions for WordsAPI integration
  - [x] Implement seed function for initial word data (Jan 1 - Mar 3, 2025)
  - [x] Implement daily word updates function
  - [x] Set up automated cron job for daily word updates at midnight UTC
  - [x] Implement enhanced distractor generation for word quizzes
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
- Schema implemented with tables:
  - `words`: Stores detailed word information (definitions, examples, etc.)
  - `daily_words`: Maps words to dates and difficulty levels
  - `user_progress`: Tracks user interactions with words
  - `word_distractors`: Stores high-quality distractors for word quizzes
- Row Level Security implemented for data protection
- Enhanced distractor generation using multiple strategies:
  1. Stored high-quality distractors from a dedicated database table
  2. Alternative definitions from the same word (different meanings)
  3. Definitions from synonyms and antonyms of the word
  4. Part-of-speech specific templates based on difficulty level
  5. Smart templates using contextually relevant content
  6. Quality scoring system to improve distractor selection over time

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
- seedWordsForDateRange function has populated words for dates from Jan 1 2025 to March 3 2025
- addWordForNextDay function will add a new word each day at midnight
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

