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

## Current Focus
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
1. **Implement Supabase data fetching layer and replace mock services.**
2. **Begin refactoring `app/(tabs)/index.tsx` and other large components.**
3. Define and implement testing strategy (Jest config, component tests).
4. Standardize JSDoc comments across codebase.
5. Implement consistent loading/error state components.
6. Develop robust error handling for API services.

## Current Status

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

### Enhanced Layout Component (`Box`)
The foundational `Box` component in `src/components/layout/` has been refactored to:
- Accept theme tokens directly for `backgroundColor`, `borderColor`, `padding`, `margin`, `borderRadius`, etc.
- Provide comprehensive Flexbox, dimension, and positioning props.
- Improve type safety and maintainability.
This streamlines UI development and enforces design system consistency.

### Visual Component Enhancements (`MeshGradient`)
The MeshGradientCard component has been significantly enhanced with:
- Performance optimizations using React.memo and proper hook usage
- Expanded color palette system with 27 nature-inspired combinations
- Elegant inner border styling with theme-based opacity
- Planned paper-like noise texture overlay using Skia shaders

This implementation provides a foundation for consistent visual styling across the app with optimized performance.

### Status Bar Fixes
Resolved a persistent dark mode issue on iOS where the status bar text was appearing dark on dark backgrounds:
- Updated UIStatusBarStyle in Info.plist to UIStatusBarStyleLightContent
- Added StatusBar component to tab layout for consistent appearance
- Ensured proper handling of color scheme changes

### Performance Optimizations
Recent performance enhancements include:
- Proper memoization strategies for complex components
- Optimized gradient rendering for better battery life
- Reduced unnecessary re-renders through careful component design

## Next Major Milestones

### Backend Integration (Target: TBD)
- Implement Supabase client and API functions.
- Replace `wordOfDayService` mock logic.
- Connect UI components to live data.
- Implement robust error handling and loading states for API calls.

### Component Refactoring & Testing (Target: Ongoing)
- Refactor `app/(tabs)/index.tsx` using custom hooks.
- Refactor `OptionButton` and other large components.
- Implement initial test suite (unit & component tests).

### Visual System Completion (Target: TBD)
- Complete paper-like noise texture overlay
- Create reusable gradient background component
- Document usage patterns and performance considerations

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