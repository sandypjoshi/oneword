# OneWord App Theme System

This document outlines the theme system for the OneWord app.

## Overview

The theme system provides:
- Light and dark mode support
- Consistent spacing, typography, and colors
- Theme-aware components
- Easy theme access via React Context

## Usage

### Accessing Theme Values

You can access theme values anywhere in your app using the `useTheme` hook:

```tsx
import { useTheme } from '../src/theme/ThemeProvider';

function MyComponent() {
  const { colors, spacing, typography, isDark } = useTheme();
  
  return (
    <View style={{ 
      backgroundColor: colors.background.primary,
      padding: spacing.md,
    }}>
      {/* Component content */}
    </View>
  );
}
```

### Theme-Aware Components

The theme system includes ready-to-use components that automatically apply theme values:

#### Text Component

```tsx
import { Text } from '../src/theme/Text';

// Text with variant
<Text variant="h1">Heading</Text>
<Text variant="body1">Body text</Text>

// With color
<Text color={colors.primary}>Colored text</Text>

// With alignment
<Text align="center">Centered text</Text>
```

#### Box Component

```tsx
import { Box } from '../src/theme/Box';

// Basic usage
<Box padding="md">Content</Box>

// With color and spacing
<Box 
  bg={colors.background.card}
  padding="lg"
  marginBottom="md"
>
  Content
</Box>

// Centered content
<Box center padding="lg">
  Centered Content
</Box>
```

### Theme Structure

The theme consists of these main parts:

#### Colors

- `background`: Surface colors (primary, secondary, card)
- `text`: Text colors (primary, secondary, hint, inverse)
- `border`: Border colors (light, medium, dark)
- `primary`: Brand color (with light/dark variants)
- Status colors: `success`, `error`, `warning`, `info`

#### Typography

- Text variants: `h1`, `h2`, `h3`, `h4`, `body1`, `body2`, `button`, `caption`, `label`
- Font sizes, weights, and line heights

#### Spacing

- Size scale: `xs` (4), `sm` (8), `md` (16), `lg` (24), `xl` (32), `xxl` (48)
- Specific values: `screenPadding`, `cardPadding`, `inputPadding`, etc.

### Theme Switching

The theme system supports three modes:
- `light`: Always use light theme
- `dark`: Always use dark theme
- `system`: Follow device settings (default)

You can switch themes using the `setMode` function:

```tsx
import { useTheme } from '../src/theme/ThemeProvider';

function ThemeSwitcher() {
  const { setMode } = useTheme();
  
  return (
    <View>
      <Button onPress={() => setMode('light')} title="Light Theme" />
      <Button onPress={() => setMode('dark')} title="Dark Theme" />
      <Button onPress={() => setMode('system')} title="System Theme" />
    </View>
  );
}
```

## Extending the Theme

To add new theme values:

1. Add your values to the appropriate theme file
2. Update the ThemeContext type to include your new values
3. Use your new values in components

## Best Practices

- Always use the theme system instead of hardcoding colors or styles
- Create themed variants of any new components you build
- Test your UI in both light and dark modes

## Responsive Typography

The app includes an integrated responsive typography system that automatically scales text based on device screen size. This ensures optimal readability across different devices.

### Accessing Typography

There are two main ways to use typography in the app:

1. **Using the Text component (recommended)**:
   ```tsx
   import { Text } from 'components/ui';
   
   function MyComponent() {
     return (
       <Text variant="headingLarge">
         This is a heading
       </Text>
     );
   }
   ```

2. **Using the typography styles directly**:
   ```tsx
   import { useTheme } from 'theme';
   import { Text as RNText } from 'react-native';
   
   function MyComponent() {
     const { responsiveTypography } = useTheme();
     
     return (
       <RNText style={responsiveTypography.headingLarge}>
         This is a heading
       </RNText>
     );
   }
   ```

3. **Using the helper hook**:
   ```tsx
   import { useResponsiveText } from 'hooks';
   import { Text as RNText } from 'react-native';
   
   function MyComponent() {
     const headingStyle = useResponsiveText('headingLarge');
     
     return (
       <RNText style={headingStyle}>
         This is a heading
       </RNText>
     );
   }
   ```

### Typography Variants

The typography system includes these variants:

- **Display**: `displayLarge`, `displayMedium`, `displaySmall`
- **Heading**: `headingLarge`, `headingMedium`, `headingSmall`
- **Serif Text**: `serifTextLarge`, `serifTextMedium`, `serifTextSmall`
- **Body**: `bodyLarge`, `bodyMedium`, `bodySmall`, `bodyEmphasized`
- **Functional**: `button`, `buttonSmall`, `caption`, `label`, `overline`, `note`, `subtitle`

## Color System

Colors are organized by semantic role, with light and dark variants automatically selected based on the current color mode.

```tsx
// Examples of color usage
colors.background.primary  // Main background color
colors.text.primary        // Primary text color
colors.primary.500         // Primary brand color
colors.error               // Error state color
```

## Spacing

Spacing follows a consistent scale to ensure proper layout rhythm:

```tsx
// Examples of spacing usage
spacing.xs   // Extra small space
spacing.sm   // Small space
spacing.md   // Medium space
spacing.lg   // Large space
spacing.xl   // Extra large space
```

For more detailed information about typography specifically, see [typography.md](./typography.md). 