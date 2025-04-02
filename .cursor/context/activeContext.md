# Active Context

## Current Focus
- **Awaiting user direction after completing codebase analysis.**
- Transitioning from mock data to real backend integration (Supabase).
- Refactoring large UI components/screens (e.g., `app/(tabs)/index.tsx`, `OptionButton`) for better maintainability.
- Implementing a comprehensive component testing strategy.
- Enhancing UI components with advanced visual effects using Skia (e.g., noise texture for gradients).
- Improving API error handling in service layers.
- Ensuring consistent loading/error state implementation.
- Completing Practice and Profile tab functionality.

## Recent Changes
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
1.  **Await User Input:** Determine the next task based on user instructions following the codebase analysis.
2.  **Potential Immediate Priorities (Pending User Confirmation):**
    *   Implement Supabase client and data fetching functions (e.g., in `src/services` or `src/api`).
    *   Connect `wordOfDayService` and relevant UI components (especially `app/(tabs)/index.tsx`) to use live Supabase data.
    *   Begin refactoring `app/(tabs)/index.tsx` by extracting logic into custom hooks (e.g., `useDailyWords`, `useCarouselPagination`).
    *   Define and implement a testing strategy (Unit, Component, Integration).
    *   Implement consistent loading and error state components/handling.
3.  **Component/Feature Development:**
    *   Implement Practice tab functionality (Challenge screen, exercises).
    *   Implement Profile tab functionality (User settings, stats).
    *   Implement paper-like noise texture overlay for `MeshGradient` components.
    *   Create reusable `MeshGradient` background component.
4.  **Technical Debt & Refinement:**
    *   Consolidate project structure (`lib` vs `src`, `api` vs `services`).
    *   Refactor other large components identified (e.g., `OptionButton`, `WordCardAnswer`).
    *   Audit semantic color token usage and accessibility across all components.
    *   Enhance API error handling robustness.
5.  **Documentation:**
    *   Standardize JSDoc comments across the codebase.
    *   Update component documentation, especially for `Box` and `MeshGradient`.
    *   Document testing strategy.

## Known Issues
- **No Backend Integration:** The application frontend currently uses only **mock data**. No Supabase data fetching is implemented yet.
- **Large Components:** Several components/screens (`app/(tabs)/index.tsx`, `OptionButton.tsx`, `WordCardAnswer.tsx`, `meshGradientGenerator.ts`) are very large and complex, needing refactoring.
- **Low Test Coverage:** Lack of comprehensive automated tests.
- **Inconsistent Loading/Error States:** Missing standardized handling for loading and error UI states.
- **Potential Gesture Conflicts:** Need ongoing monitoring for gesture issues, especially with complex components like `OptionButton`.
- **Visual Performance:** Skia gradient animations and effects need performance testing on lower-end devices.
- **Content Quality Variance:** Quality of generated word data (definitions, distractors) may vary (Noted from previous state, pending review).

## Active Context (Summary)
This file tracks the current state, focus, changes, and known issues for the OneWord app. **The AI assistant has just completed a comprehensive analysis of the codebase and is awaiting user direction for the next task.** Potential next steps involve backend integration, component refactoring, and testing.

### Current Focus: Awaiting User Input
The assistant has analyzed the codebase and awaits instructions for the next development task.

#### Enhanced Swipe Gesture Handling Fix (Implemented)

**Root Cause:** App crashes and accidental button taps during card swiping were caused by conflicting gesture handlers. A time-based approach to block interactions was not sufficient to prevent all accidental taps.

**Key Changes:**
- Enhanced the `OptionButton` component with a `PanResponder` to properly detect and handle swipe gestures
- Implemented a robust movement tracking system that distinguishes between taps and swipes
- Removed the previous time-based touch tracking from `WordCardQuestion` component
- Added a small delay to button actions to prevent accidental taps
- The solution properly respects the parent's gesture handling while ensuring that accidental taps don't trigger during swipes

**Strategy:**
1. The `PanResponder` in `OptionButton` now tracks the start of touch interactions
2. If the touch moves more than a small threshold (10px), it's considered a swipe and the press is canceled
3. Only registers a tap if the movement is minimal (less than threshold)
4. A small delay (100ms) is added before triggering the press, giving time to detect swipes
5. The `WordCardQuestion` component was simplified by removing its touch tracking logic

This implementation provides a more robust solution by handling the gesture detection at the button level rather than relying on timing-based detection at the card level.

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