# OneWord Typography System

The OneWord app uses a comprehensive typography system that ensures consistent text appearance across the application. The system is built to handle responsive font sizing, theming, and accessibility.

## Typography Architecture

The typography system consists of the following components:

1. **Typography Definitions** (`typography.ts`): Defines the base tokens for typography, including font families, weights, sizes, and line heights.
2. **Theme Provider with Responsive Typography** (`ThemeProvider.tsx`): Calculates and provides responsive typography styles based on screen dimensions.
3. **Text Component** (`Text.tsx`): Main component for rendering text in the app, supporting all typography variants.
4. **Responsive Text Hook**:
   - `useResponsiveText`: Simplified hook for accessing specific typography variants

## Usage Examples

### Basic Text Component Usage

```tsx
import { Text } from 'components/ui';

function MyComponent() {
  return (
    <>
      <Text variant="headingLarge">This is a large heading</Text>
      <Text variant="bodyMedium">This is a regular paragraph text</Text>
      <Text variant="caption" color="colors.primary.500">This is a caption with a custom color</Text>
    </>
  );
}
```

### Using Typography Hook Directly

```tsx
import { useResponsiveText } from 'hooks';
import { Text as RNText } from 'react-native';

function CustomText() {
  const headingStyle = useResponsiveText('headingMedium');
  
  return (
    <RNText style={headingStyle}>
      Styled with responsive typography
    </RNText>
  );
}
```

### Accessing Font Scale Directly

```tsx
import { useTheme } from 'theme';

function ResponsiveComponent() {
  const { fontScale } = useTheme();
  
  // Use fontScale for custom calculations
  const customSize = 20 * fontScale;
  
  return (
    <View style={{ height: customSize }}>
      {/* Content scaled based on font scale */}
    </View>
  );
}
```

## Typography Variants

The system includes a comprehensive set of typography variants:

- **Display**: `displayLarge`, `displayMedium`, `displaySmall`
- **Heading**: `headingLarge`, `headingMedium`, `headingSmall`
- **Serif Text**: `serifTextLarge`, `serifTextMedium`, `serifTextSmall`
- **Body**: `bodyLarge`, `bodyMedium`, `bodySmall`, `bodyEmphasized`
- **Functional**: `button`, `buttonSmall`, `caption`, `label`, `overline`, `note`, `subtitle`

## Font Families

The typography system supports multiple font families:

- **System**: System font (SF Pro on iOS, Roboto on Android)
- **Serif**: DM Serif Text
- **Serif Display**: DM Serif Display

Each font family includes variants for different weights and italic styles.

## Responsive Behavior

The typography system automatically scales based on screen size, ensuring optimal reading experience across devices. This is handled by the `ThemeProvider`, which calculates a scale factor based on screen width and optimizes it for both phone and tablet layouts. 