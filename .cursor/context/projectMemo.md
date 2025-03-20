# OneWord Project Memo

## Project Overview
OneWord is a vocabulary learning application that helps users expand their vocabulary through interactive word games, challenges, and educational content. The app presents users with new words, their definitions, and pronunciation, along with contextual examples and quizzes to reinforce learning.

## Architecture
- React Native (Expo) for cross-platform mobile development
- Supabase for backend database and authentication
- Custom design system with tokens for consistent styling

## Key Design Patterns

### Component Structure
- Atomic design approach (atoms, molecules, organisms)
- Component composition over inheritance
- Controlled components with clear prop interfaces

### State Management
- Context API for global state (theme, user preferences)
- Local component state for UI interactions
- Async storage for persistent data

### Styling Approach
- Design token system as single source of truth
- Theme-based styling with light/dark mode support
- Responsive layout using flexbox patterns

### Animation Patterns
- Declarative animations using Animated API
- Consistent timing and easing functions via tokens
- Progressive feedback for user interactions

## Code Conventions
- Typescript for type safety
- Functional components with hooks
- Component files structured by feature
- Consistent naming conventions:
  - PascalCase for components
  - camelCase for variables and functions
  - UPPER_CASE for constants

## Testing Strategy
- Unit tests for utility functions
- Component tests for UI logic
- End-to-end tests for critical user flows 