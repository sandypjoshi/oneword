# Navigation Patterns in OneWord App

This document outlines the standardized navigation patterns used in the OneWord app. We use Expo Router for all navigation, which provides file-based routing similar to Next.js.

## Navigation Structure

The app is organized with the following navigation structure:

- `app/_layout.tsx` - Root layout with Stack navigator
- `app/(tabs)/_layout.tsx` - Tab layout for the main app screens
- `app/modal/index.tsx` - Modal screen overlay
- `app/onboarding.tsx` - Onboarding screen
- `app/auth/login.tsx` - Authentication screens

## Standard Navigation Patterns

### 1. Direct Router Usage

For components that need direct navigation:

```tsx
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();
  
  const handlePress = () => {
    router.push('/some-route');
  };
}
```

### 2. Typed Navigation with useAppNavigation

For type-safe navigation to common routes:

```tsx
import { useAppNavigation } from '../src/hooks';

function MyComponent() {
  const navigation = useAppNavigation();
  
  const handlePress = () => {
    navigation.goToHome();
  };
}
```

### 3. Setting Screen Options

To update screen options (like titles), use `router.setParams()`:

```tsx
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();
  
  // Update the screen title
  router.setParams({ title: 'New Title' });
}
```

### 4. Declaring Screen Options in Layout Files

For static options, declare them in the layout files:

```tsx
// In _layout.tsx or specific screen
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'white' },
        // Other options...
      }}
    />
  );
}
```

### 5. Common Navigation Patterns

- **Tab Navigation**: Use the Tabs component in `app/(tabs)/_layout.tsx`
- **Stack Navigation**: Use the Stack component in `app/_layout.tsx`
- **Modals**: Navigate to `/modal` using `router.push('/modal')`
- **Going Back**: Use `router.back()` to navigate back

## Route Constants

All route paths are defined in `src/constants/index.ts` to ensure consistency:

```tsx
export const ROUTES = {
  HOME: '/(tabs)',
  PRACTICE: '/(tabs)/practice',
  PROFILE: '/(tabs)/profile',
  ONBOARDING: '/onboarding',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
};
```

## Best Practices

1. Always use the predefined route constants from `src/constants/index.ts`
2. Use the `useAppNavigation` hook for common navigation to maintain type safety
3. Prefer declarative routing patterns over imperative when possible
4. Keep navigation logic in hooks or containers, not in UI components
5. Use appropriate navigation types (push vs replace) depending on the use case:
   - Use `router.push()` for adding to the history stack
   - Use `router.replace()` for replacing the current screen

By following these patterns, we ensure consistent navigation behavior throughout the app and make it easier to maintain and extend the navigation structure. 