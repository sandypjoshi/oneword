# OneWord Project Memo

## Project Overview
OneWord is a vocabulary learning application that helps users expand their vocabulary through interactive word games, challenges, and educational content. The app presents users with new words, their definitions, and pronunciation, along with contextual examples and quizzes to reinforce learning.

## Architecture
- React Native (Expo) for cross-platform mobile development (New Architecture enabled)
- Supabase for backend database and authentication (**Production database deployed and ready**)
- Zustand for state management
- Custom design system with tokens for consistent styling
- AI-first content generation with Gemini 2.5 Pro structured output

## Key Design Patterns

### Component Structure
- Atomic design approach (atoms, molecules, organisms)
- Component composition over inheritance
- Controlled components with clear prop interfaces

### State Management
- Zustand for managing application state (word data, card interactions, user progress)
- Context API used primarily for ThemeProvider
- Async storage for persisting theme preferences and user progress (via Zustand middleware)

### Styling Approach
- Design token system (colors, typography, spacing) as single source of truth
- Theme-based styling (`ThemeProvider`, `useTheme` hook) with light/dark modes and multiple themes (Default, Quill)
- Foundational layout components (`Box`, `Text` (Enhanced)) integrate directly with theme tokens via props
- Reusable UI components (`Separator` (New), `Chip`, `Icon`, etc.)
- Responsive layout using flexbox patterns (via `Box` component)
- Semantic color tokens for consistent theming

### Animation Patterns
- Reanimated for performant UI animations (e.g., card flip)
- Animated API (used in `ThemeProvider` transition, potentially elsewhere)
- Consistent timing and easing functions via tokens (Potential: verify if animation tokens exist)
- Progressive feedback for user interactions (e.g., Haptics)

### Animation State Management
- Using refs and store state for persistent animations

## Current Focus
- **Backend API Development:** Building services using completed database infrastructure
- **Content Generation Revolution:** AI-first vocabulary curation with Gemini 2.5 Pro
- **Frontend Integration:** Connecting React Native app to production Supabase backend
- **Sprint Acceleration:** Leveraging 2-day schedule advantage for parallel development

## Code Conventions
- Typescript for type safety
- Functional components with hooks
- Component files structured by feature
- Consistent naming conventions:
  - PascalCase for components
  - camelCase for variables and functions
  - UPPER_CASE for constants

## Testing Strategy (Planned)
- Unit tests for utility functions, hooks, stores.
- Component tests (React Native Testing Library) for UI logic.
- Integration tests for key user flows.
- End-to-end tests (potentially using Maestro or Detox) for critical user journeys.
- Snapshot tests for UI components.
- Accessibility testing for all interactive elements.

## Audit Findings (March 2024)
A comprehensive code audit verified compliance with project rules and standards, with the following insights:

### Strengths
- Strong adherence to design system with consistent token usage
- Well-structured components with proper TypeScript typing
- Good component organization and file structure
- Proper implementation of accessibility features in UI components
- Effective use of React hooks and performance optimization techniques

### Areas for Improvement
- Need for comprehensive testing implementation
- Enhanced documentation to improve code maintainability
- More robust error handling in service layers
- Transition from mock data to real API endpoints
- Consistent loading state implementation across components

## Priority Action Items
1. **Generate Theme Vocabularies:** Complete remaining 4 themes using optimized AI prompts
2. **Build Backend APIs:** Implement word assignment, progress tracking, and timeline services
3. **Integrate Frontend:** Connect React Native app to production Supabase backend
4. **Implement Authentication:** User registration, login, and profile creation flow
5. **API Integration:** Free Dictionary API for definitions and pronunciation
6. **End-to-End Testing:** Complete user journey validation from onboarding to learning

## Current Status
- **UI Development**: 85% complete (most core screens/components exist)
- **Database Infrastructure**: 100% complete (**MAJOR BREAKTHROUGH**)
- **Content Strategy**: 100% complete (**AI-first approach finalized**)
- **State Management**: 75% complete (core stores exist, need real data integration)
- **Animation System**: 90% complete (recent improvements)
- **Backend API Development**: 10% (foundation ready, services in progress)
- **Frontend Integration**: 5% (ready to connect to production backend)
- **Testing**: 15% complete

### Recent Accomplishments

#### Major Breakthrough (June 7, 2025)
- ✅ **Production Database Infrastructure Complete:** 4 migration files deployed with comprehensive schema
- ✅ **Content Strategy Revolution:** AI-first approach finalized, abandoning complex script systems
- ✅ **Adaptive Difficulty System:** Enhanced database schema with smart progression and skip logic
- ✅ **Sprint Acceleration:** Project now 2 days ahead of 21-day timeline
- ✅ **Quality AI Prompts:** Professional theme prompt ready for 800-word generation
- ✅ **Technical Architecture:** PostgreSQL enums, helper functions, 13 performance indexes deployed

#### Previous UI & System Improvements
- ✅ **Fixed Font Rendering Issues:** Resolved inconsistencies with bold, serif, and italic text rendering in the custom `Text` component.
- ✅ **Created Reusable Separator:** Implemented a theme-aware `Separator` UI component.
- ✅ **Refactored Card Separators:** Replaced inline separators in `WordCardAnswer` and `ReflectionCard` with the new `Separator` component.
- ✅ **Cleaned Up UI Components:** Removed the unused `PronunciationChip` component.
- ✅ **Improved Definition Display:** Increased font size for definitions in `WordCardAnswer`.
- ✅ **Fixed Card Flip Animation & State Persistence:** Resolved critical issues with WordCard state and animations (2024-04-06).
- ✅ **Refactored foundational `Box` component** for full theme integration and extended layout capabilities (2024-04-01).
- ✅ Completed the enhanced MeshGradientCard component with improved visual appearance and performance.
- ✅ Fixed critical iOS dark mode status bar issues
- ✅ Expanded gradient color palettes with nature-inspired combinations (27 total options)
- ✅ Resolved swiping issues in word card interaction
- ✅ Finished comprehensive codebase audit against established standards
- ✅ Fixed UI component contrast issues for Quill theme

### Active Development
- 🔄 **Backend API Development:** Building services using deployed database infrastructure
- 🔄 **Content Generation:** Creating remaining theme vocabularies with AI-first approach
- 🔄 **Frontend Integration:** Connecting React Native app to production Supabase
- 🔄 **User Authentication:** Implementing registration, login, and profile creation
- 🔄 **API Integration:** Free Dictionary API for definitions and pronunciation
- 🔄 Refactoring `app/(tabs)/index.tsx` (Lower Priority)
- 🔄 Defining testing strategy and setup (Medium Priority)
- 🔄 Implementing paper-like noise texture overlay for gradients (Lower Priority)

### Key Priorities (Revised)
1. **Generate Complete Theme Vocabularies:** 4,000 words across 5 themes using AI-first approach
2. **Build Backend API Services:** Word assignment, progress tracking, timeline APIs
3. **Connect Frontend to Backend:** Real data integration replacing mock services
4. **Implement User Authentication:** Complete onboarding and profile management flow
5. **Integrate External APIs:** Free Dictionary API for enriched word data
6. **End-to-End Testing:** Complete user journey validation and quality assurance

## Technical Highlights
- Sophisticated mesh gradient system using Skia
- Custom theme system with token support
- Flexible and extendable Box layout component
- Robust card flip animation system with state persistence across navigation
- Enhanced error handling for animations and state transitions
- **Refined custom Text component handling complex font styles**
- **Reusable Separator component**

## Next Major Milestones
1. **Backend Connected:** App fetches live data from Supabase.
2. **Streak Feature MVP:** Basic streak counting functional.
3. **Testing Infrastructure:** Initial tests running.
4. **Complete Practice Tab**: Fully functional practice module
5. **Complete Profile Tab**: User settings and statistics
6. **Release Beta Version**: For internal testing

## Known Issues and Risks

### Key Issues
- **Backend Integration Pending:** App uses mock data, need to connect to production Supabase
- **Content Generation In Progress:** Professional theme ready, 4 themes remaining
- **Authentication Flow Missing:** User registration and profile creation not implemented
- **API Integration Pending:** Free Dictionary API integration for definitions needed
- **Component Complexity:** Several large components need refactoring
- **Test Coverage:** Comprehensive testing strategy needed for production readiness

### Technical Debt
- Project structure (`lib` vs `src`) needs consolidation.
- Need comprehensive testing strategy for visual components.
- Animation performance on lower-end devices requires optimization.
- Text contrast on some gradient combinations may need adjustment.

### Resource Constraints
- Limited design resources for creating comprehensive guidelines
- Testing capacity across diverse device range
- Content quality review capacity for AI-generated vocabularies

## General Notes
The project has achieved a major breakthrough with complete database infrastructure and revolutionary content strategy. **Production-ready Supabase database is deployed with comprehensive schema, security, and performance optimizations.** AI-first content generation approach validated and ready for rapid vocabulary creation. Project is now 2 days ahead of 21-day sprint schedule, enabling aggressive parallel development of backend APIs, frontend integration, and content generation.

## Animation and State Management Improvements
- Enhance and fix WordCard animations
- Ensure consistent state persistence across navigation
- Implement proper error handling in animations

## State Persistence Improvements
- Improve state persistence across navigation
- Implement proper error handling in state management