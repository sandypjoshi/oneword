# OneWord Project Memo

## Project Overview
OneWord is a vocabulary learning application that helps users expand their vocabulary through interactive word games, challenges, and educational content. The app presents users with new words, their definitions, and pronunciation, along with contextual examples and quizzes to reinforce learning.

## Architecture
- React Native (Expo) for cross-platform mobile development (New Architecture enabled)
- Supabase for backend database and authentication (**Note: New DB setup pending, frontend integration pending**)
- Zustand for state management
- Custom design system with tokens for consistent styling

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
- **Database Setup:** Waiting for the new Supabase project/DB to be created. (**BLOCKER**)
- **Streak Feature (Paused):** Planning complete, implementation blocked by DB setup.
- **UI Refinements (Ongoing):** Ensuring component consistency, addressing minor visual bugs.

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
1. **Setup New Supabase Database:** Create project, configure initial settings.
2. **Database Migrations:** Establish core tables (`profiles`, `words`, etc.) and add streak columns.
3. **Implement Backend Logic:** Create Supabase Edge Function for streak updates.
4. **Integrate Frontend with Backend:** Replace mock data, connect streak logic.
5. **Expand Test Coverage:** Begin adding tests as backend integration proceeds.
6. **Refactor Large Components:** Improve maintainability (lower priority until backend is connected).

## Current Status
- **UI Development**: 85% complete (most core screens/components exist)
- **State Management**: 75% complete (core stores exist, need real data integration)
- **Animation System**: 90% complete (recent improvements)
- **Backend Integration**: 0% (**Blocked** by DB Setup)
- **Testing**: 15% complete

### Recent Accomplishments
- ✅ **Fixed Font Rendering Issues:** Resolved inconsistencies with bold, serif, and italic text rendering in the custom `Text` component.
- ✅ **Created Reusable Separator:** Implemented a theme-aware `Separator` UI component.
- ✅ **Refactored Card Separators:** Replaced inline separators in `WordCardAnswer` and `ReflectionCard` with the new `Separator` component.
- ✅ **Cleaned Up UI Components:** Removed the unused `PronunciationChip` component.
- ✅ **Improved Definition Display:** Increased font size for definitions in `WordCardAnswer`.
- ✅ **Streak Feature Planning:** Completed detailed planning for core logic, data model, and UX.
- ✅ **Fixed Card Flip Animation & State Persistence:** Resolved critical issues with WordCard state and animations (2024-04-06).
- ✅ **Refactored foundational `Box` component** for full theme integration and extended layout capabilities (2024-04-01).
- ✅ Completed the enhanced MeshGradientCard component with improved visual appearance and performance.
- ✅ Fixed critical iOS dark mode status bar issues
- ✅ Expanded gradient color palettes with nature-inspired combinations (27 total options)
- ✅ Resolved swiping issues in word card interaction
- ✅ Finished comprehensive codebase audit against established standards
- ✅ Fixed UI component contrast issues for Quill theme

### Active Development
- ⏸️ **Streak Feature Implementation (Paused)**
- ⏸️ **Implementing Supabase client & data fetching (Paused/Blocked)**
- 🔄 Refactoring `app/(tabs)/index.tsx` (Lower Priority)
- 🔄 Defining testing strategy and setup (Lower Priority)
- 🔄 Implementing paper-like noise texture overlay for gradients (Lower Priority)
- 🔄 Creating reusable MeshGradient background component (Lower Priority)
- 🔄 Exploring animation options for subtle gradient movement (Lower Priority)
- 🔄 Updating documentation for new visual components (Ongoing)

### Key Priorities (Revised)
1. **Setup New Supabase Database.**
2. **Establish Database Schema/Migrations.**
3. **Implement Core Backend Logic (Starting with Streaks).**
4. **Connect Frontend to Supabase (Starting with Streaks & Word of Day).**
5. Begin implementing testing strategy.

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
- **No Backend Integration:** App uses mock data only. (**BLOCKER**)
- **Streak Feature Not Implemented:** Blocked by DB Setup.
- **Component Complexity:** Several large components need refactoring.
- **Low Test Coverage:** Lack of automated tests.
- **Inconsistent Loading/Error States:** Needs standardized handling.

### Technical Debt
- Project structure (`lib` vs `src`) needs consolidation.
- Need comprehensive testing strategy for visual components.
- Animation performance on lower-end devices requires optimization.
- Text contrast on some gradient combinations may need adjustment.

### Resource Constraints
- Limited design resources for creating comprehensive guidelines
- Testing capacity across diverse device range
- **Dependency on Database Setup**

## General Notes
The project has a strong frontend foundation with significant UI refinements recently completed, including fixing complex font rendering and creating reusable components. However, **all forward progress on features requiring data persistence (like Streaks) is currently blocked pending the setup of the new Supabase database.** The immediate focus must be on establishing this backend infrastructure.

## Animation and State Management Improvements
- Enhance and fix WordCard animations
- Ensure consistent state persistence across navigation
- Implement proper error handling in animations

## State Persistence Improvements
- Improve state persistence across navigation
- Implement proper error handling in state management