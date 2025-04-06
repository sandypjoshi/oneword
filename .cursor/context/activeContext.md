# Active Context

## Current Focus
- **Card animation and state management improvements**
- Refactoring large UI components/screens (e.g., `app/(tabs)/index.tsx`, `OptionButton`) for better maintainability.
- Implementing a comprehensive component testing strategy.
- Enhancing UI components with advanced visual effects using Skia (e.g., noise texture for gradients).
- Improving API error handling in service layers.
- Ensuring consistent loading/error state implementation.
- Completing Practice and Profile tab functionality.

## Recent Changes
### Card Flip Animation & State Persistence Fix (2024-04-06)
1. **Goal**: Fix two critical issues in the WordCard component: (1) flip animation not working when selecting correct answers, and (2) revealed words sometimes showing question face after tab switching.
2. **Root Causes**: 
   - Animation Issue: The flip animation was properly defined but not correctly triggered when selecting correct answers.
   - State Persistence: When switching tabs, component remounting caused animation state to reset, sometimes conflicting with logical state.
3. **Key Changes**:
   - Added safeguards in wordCardStore to prevent revealed words from showing question face
   - Enhanced initialization logic to ensure consistent state on component mount
   - Fixed backfaceVisibility handling for proper 3D card flipping
   - Improved animation timing and easing for smoother transitions
   - Added proper z-index and opacity handling during card face transitions
   - Implemented defensive error handling for animation state
4. **Lessons Learned**:
   - Interaction between React's component lifecycle, navigation focus events, and Reanimated's animation system requires careful coordination
   - Multiple correction points for the same logical state can create instability
   - Immediate state changes during focus events should be minimized as they can create update loops

### Codebase Analysis (2024-04-01)
1. **Goal**: Gain a deep understanding of the OneWord project structure, components, state management, themes, and overall architecture.
2. **Method**: Systematically reviewed all files within `./app` and `./src` directories using `list_dir` and `read_file` tools. Analyzed file purpose, interactions, and key logic.
3. **Outcome**: Developed a comprehensive overview of the project, documented in the conversation summary and memory bank. Key findings include: Expo Router usage, Zustand state management, custom theming system with Skia mesh gradients, mock data service layer, and reusable component library. Identified areas for improvement like backend integration, large component refactoring, and testing.

### Box Component Refactoring (2024-04-01)
1. **Goal:** Enhance the foundational `Box` layout component for full theme integration and comprehensive layout props.
2. **Analysis:** Identified `src/components/layout/Box.tsx` as the active component, replacing the unused `src/theme/Box.tsx`.
3. **Enhancements:**
    - Added support for theme color token paths (e.g., `backgroundColor="background.primary"`).
    - Added support for theme spacing token keys (e.g., `padding="md"`, `borderRadius="lg"`).
    - Integrated a full suite of Flexbox, dimension, and positioning props.
    - Improved type safety by deriving token keys from theme types.
    - Optimized style calculations using `useMemo`.
4. **Implementation:** Replaced `src/components/layout/Box.tsx` with the refactored code and deleted `src/theme/Box.tsx`.

### MeshGradient Component Enhancement (2024-03-25)
1. **Component Redesign**: Renamed and enhanced gradient card component
   - Renamed AnimatedGradientCard to MeshGradientCard for clarity
   - Implemented elegant inner border with theme-based opacity
   - Enhanced with nature-inspired color palettes for both modes
   - Optimized for performance with React.memo and proper hooks usage

2. **Visual Improvements**:
   - Added subtle inner border with 2px width for better definition
   - Expanded color palettes from 7 to 12 in light mode and 15 in dark mode
   - Adjusted lightness of light mode colors for more vibrant appearance
   - Reduced saturation of dark mode blues to prevent eye strain
   - Upgraded select palettes to use 4 colors for more complex gradients

3. **Performance Optimizations**:
   - Wrapped component with React.memo to prevent unnecessary re-renders
   - Used useRef for mesh data storage to maintain references between renders
   - Implemented useCallback for event handlers to prevent recreation
   - Memoized all derived values with useMemo to avoid recalculating
   - Added proper cleanup in useEffect to prevent memory leaks

4. **iOS Dark Mode Fix**:
   - Fixed status bar appearance in dark mode on iOS
   - Updated UIStatusBarStyle in Info.plist to UIStatusBarStyleLightContent
   - Added StatusBar component to tabs layout for consistent appearance across screens

### Swipe Crash Fix (2024-03-23)
1. **Issue Resolved**: Fixed app crashes when swiping between word cards
   - Root cause: Import error and gesture handler conflicts with FlashList
   - Impact: App would crash when users tried to swipe between cards

2. **Key Implementation Changes**:
   - Fixed import path for useTheme, now importing from the theme index file
   - Removed the GestureDetector and Gesture.Pan() implementation to prevent conflicts
   - Implemented a lightweight touch event tracking system using onPressIn/onPressOut
   - Added a time-based cooldown approach to prevent accidental taps during swipes

3. **Implementation Strategy**:
   - Used TouchableWithoutFeedback which doesn't interfere with parent scrolling
   - Created refs to track touch event timestamps
   - Implemented a 250ms cooldown after touch events to identify potential swipes
   - Maintained the same functionality while avoiding conflicts with FlashList

### Swipe Gesture Handling Fix (2024-03-23)
1. **Issue Resolved**: Fixed accidental option button taps during word card swiping
   - Root cause: Swipe gestures were being interpreted as button taps
   - Impact: Users would accidentally select options when trying to swipe between cards

2. **Key Implementation Changes**:
   - Added gesture detection using GestureDetector from react-native-gesture-handler
   - Implemented a system to track swipe state using refs
   - Modified option selection logic to ignore taps during swipe gestures
   - Added proper cleanup to prevent memory leaks

3. **Implementation Strategy**:
   - Used a Pan gesture handler to detect horizontal swipes
   - Created a timeout-based system to block taps during and shortly after swipes
   - Kept the implementation lightweight to maintain performance

### Codebase Standards Audit (2024-03-23)
1. **Audit Completed**: Comprehensive review of codebase against established standards
   - Reviewed compliance with rules.mdc, react-native-rules.mdc, vibes.mdc, and ui-design-rules.mdc
   - Verified component structure, typing, and design system usage

2. **Key Findings**:
   - Strong adherence to design system with proper token usage
   - Well-organized component structure with functional components and TypeScript
   - Good accessibility implementation in UI components
   - Areas for improvement: testing, documentation, error handling

3. **Improvement Areas Identified**:
   - Need for comprehensive component testing implementation
   - Enhanced JSDoc documentation for better code understanding
   - More robust error handling in service layers
   - Transition from mock data to real API endpoints
   - Consistent loading state implementation across components

### UI Component Contrast Enhancement (2024-03-22)
1. **Issue Resolved**: Improved contrast for OptionButton components in the Quill theme
   - Root cause: Background color too similar to surrounding content
   - Impact: Buttons were hard to distinguish in the Quill theme

2. **Key Implementation Changes**:
   - Modified OptionButton to use `background.active` for light mode instead of `background.tertiary`
   - Updated text color to use `text.secondary` for better contrast
   - Added hairline border to default state buttons for better visual definition
   - Fixed component to properly handle color schemes

3. **Theme System Simplification**:
   - Removed the unused Aura theme completely from the codebase
   - Updated ThemeName types across the system to only include 'default' and 'quill'
   - Simplified theme mapping in colors.ts and typography.ts

### Typography System Fix (2024-03-19)
1. **Issue Resolved**: Fixed critical issue with button text styling not respecting typography tokens
   - Root cause: Incorrect access of typography styles in Text component
   - Impact: Button text was inconsistent across the app

2. **Key Implementation Changes**:
   - Fixed Text component's access to theme typography styles
   - Removed hardcoded values and special cases
   - Properly utilizing variant system for consistent styling

3. **Design System Guidelines**:
   - Always use typography tokens through the variant system
   - Never bypass design tokens with hardcoded values
   - Follow the proper style chain: tokens → theme → component

## Next Steps
1. **Expand Test Coverage:** 
   - Implement unit tests for the Zustand stores, particularly focusing on wordCardStore
   - Create component tests for WordCard and related components to ensure animation and state behavior
   - Test edge cases for tab switching and animation state

2. **Continue UI Refinements:**
   - Address any remaining animation issues with WordCard
   - Refactor large components for better maintainability
   - Implement consistent loading and error states

3. **Backend Integration:**
   - Connect frontend to Supabase for live data
   - Implement proper error handling for API requests
   - Add caching for better offline experience

4. **Visual Enhancements:**
   - Add paper-like noise texture to gradient components
   - Create reusable gradient background component
   - Optimize animations for battery efficiency

## Known Issues
- **Animation Performance:** Current Reanimated-based animations may have performance implications on lower-end devices. Need to profile and optimize.
- **Large Components:** Several components/screens (`app/(tabs)/index.tsx`, `OptionButton.tsx`, `WordCardAnswer.tsx`, `meshGradientGenerator.ts`) are very large and complex, needing refactoring.
- **Low Test Coverage:** Lack of comprehensive automated tests, especially for complex interactions like animations.
- **No Backend Integration:** The application frontend currently uses only **mock data**. No Supabase data fetching is implemented yet.
- **Inconsistent Loading/Error States:** Missing standardized handling for loading and error UI states.

## Active Context (Summary)
This file tracks the current state, focus, changes, and known issues for the OneWord app. **The recent focus has been on fixing critical animation and state persistence issues in the WordCard component.** The work has improved the stability and user experience by ensuring card animations work correctly and state remains consistent across tab navigation.

### Current Focus: Animation and State Management
The assistant has successfully addressed critical issues with card animations and state persistence, ensuring a consistent user experience even with complex component lifecycles and navigation interactions.

#### Card Flip Animation & State Persistence Fix (Implemented)

**Root Causes:** 
1. The flip animation between question and answer faces wasn't being properly triggered
2. Tab navigation caused component remounting, leading to inconsistent state between store and UI

**Key Changes:**
- Added safeguards to prevent revealed words from showing question face
- Fixed animation timing and visual properties for smooth transitions
- Improved component initialization to ensure consistent state
- Enhanced error handling to prevent crashes

**Architecture Improvements:**
- Made the store the definitive source of truth for card state
- Implemented proper state initialization on component mount
- Ensured visual state correctly reflects logical state after navigation events

This implementation provides a more reliable user experience by properly handling both animation states and persistent logical states, even through navigation and component lifecycle events.

#### Previous Swipe Crash Fix (Implemented)

**Root Cause:** App crashes during card swipes were found to be caused by two issues:

1. Import path issue in `WordCardQuestion.tsx` (importing from wrong path)
2. Conflict between the gesture handler and FlashList scroll handling

**Key Changes:**
- Fixed the import path for `useTheme` from `../../theme/ThemeProvider` to `../../theme`
- Implemented a lightweight touch tracking system that avoids interfering with the parent scrolling
- The solution avoids potential crashes while still preventing accidental button taps during swipes

#### Codebase Standards Audit (In Progress)

The audit has identified several areas for improvement:

**Strong Areas:**
- UI component organization follows design tokens and theme system
- Accessibility features like contrast, scaling, and semantic markup
- Clean separation of concerns in component architecture

**Areas for Improvement:**
- Test coverage is minimal, particularly for critical user journeys
- Error handling needs enhancement in network operations
- Component documentation needs improvement in some areas

#### UI Component Contrast Enhancement (Completed)

Improved contrast in OptionButton component for better accessibility, particularly for dark mode users.

### Next Steps

1. Complete documentation updates for the gesture handling solution
2. Implement automated tests for the word card components
3. Monitor user feedback to ensure the swipe gesture fix resolves all edge cases

### Known Issues

1. Card animations may stutter on older devices during rapid interactions
2. Text-to-speech occasionally fails on certain Android devices 