# OneWord Project Memo

## Project Overview
OneWord is a vocabulary learning application that helps users expand their vocabulary through interactive word games, challenges, and educational content. The app presents users with new words, their definitions, and pronunciation, along with contextual examples and quizzes to reinforce learning.

## Architecture
- React Native (Expo) for cross-platform mobile development (New Architecture enabled)
- Supabase for backend database and authentication (**Note: Frontend integration pending**)
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
- Foundational layout components (`Box`, `Text`) integrate directly with theme tokens via props
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
- **Animation and State Management**: Fixing and improving flip animations in WordCard component and ensuring state persistence
- **Implementing Supabase data fetching** and transitioning the app from mock data.
- Refactoring large components (`app/(tabs)/index.tsx`, `OptionButton`, etc.).
- Implementing a comprehensive testing strategy.
- Enhancing UI with Skia effects (noise texture).
- Improving error handling and loading states.

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
1. **Animation and State Management Improvements**:
   - ✅ Fix WordCard flip animations for correct answers
   - ✅ Ensure consistent state persistence across tab navigation
   - ✅ Implement proper error handling in animations
   - Profile animation performance on different devices

2. **Performance Optimization**:
   - Profile animation performance
   - Optimize component re-renders
   - Implement efficient list rendering

3. **Backend Integration**:
   - Connect to Supabase
   - Implement error handling
   - Add caching layer

4. **Component Refactoring**:
   - Break down large components
   - Extract reusable logic into hooks
   - Improve code readability

## Current Status
- **UI Development**: 80% complete
- **State Management**: 75% complete
- **Animation System**: 90% complete (recent improvements)
- **Backend Integration**: 0% (not started)
- **Testing**: 15% complete

### Recent Accomplishments
- ✅ **Refactored foundational `Box` component** for full theme integration and extended layout capabilities.
- ✅ Completed the enhanced MeshGradientCard component with improved visual appearance and performance.
- ✅ Fixed critical iOS dark mode status bar issues
- ✅ Expanded gradient color palettes with nature-inspired combinations (27 total options)
- ✅ Resolved swiping issues in word card interaction
- ✅ Finished comprehensive codebase audit against established standards
- ✅ Fixed UI component contrast issues for Quill theme

### Active Development
- 🔄 **Implementing Supabase client & data fetching (High Priority)**
- 🔄 **Refactoring `app/(tabs)/index.tsx` (High Priority)**
- 🔄 Defining testing strategy and setup
- 🔄 Implementing paper-like noise texture overlay for gradients
- 🔄 Creating reusable MeshGradient background component
- 🔄 Exploring animation options for subtle gradient movement
- 🔄 Updating documentation for new visual components

### Key Priorities
1. **Connect Frontend to Supabase:** Replace mock data with live data.
2. **Refactor Key Components:** Improve maintainability of large screens/components.
3. **Establish Testing:** Implement initial unit and component tests.
4. Complete the mesh gradient implementation with noise texture.
5. Create a reusable gradient background component.

## Technical Highlights
- Sophisticated mesh gradient system using Skia
- Custom theme system with token support
- Flexible and extendable Box layout component
- Robust card flip animation system with state persistence across navigation
- Enhanced error handling for animations and state transitions

## Next Major Milestones
1. **Expand Test Coverage**: Increase to at least 50%
2. **Implement Supabase Integration**: Connect to real backend
3. **Complete Practice Tab**: Fully functional practice module
4. **Complete Profile Tab**: User settings and statistics
5. **Release Beta Version**: For internal testing

## Known Issues and Risks

### Key Issues
- **No Backend Integration:** App uses mock data only.
- **Component Complexity:** Several large components need refactoring.
- **Low Test Coverage:** Lack of automated tests.

### Technical Debt
- Project structure (`lib` vs `src`) needs consolidation.
- Need comprehensive testing strategy for visual components.
- Animation performance on lower-end devices requires optimization.
- Text contrast on some gradient combinations may need adjustment.

### Resource Constraints
- Limited design resources for creating comprehensive guidelines
- Testing capacity across diverse device range

## General Notes
The project has a strong foundation with a well-implemented design system and core UI features for the 'Today' tab. The immediate focus must be on integrating the frontend with the Supabase backend to replace mock data and on improving maintainability through component refactoring and testing.

## Animation and State Management Improvements
- Enhance and fix WordCard animations
- Ensure consistent state persistence across navigation
- Implement proper error handling in animations

## State Persistence Improvements
- Improve state persistence across navigation
- Implement proper error handling in state management