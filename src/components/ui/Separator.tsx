import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { useTheme } from '../../theme';
// import spacing from '../../theme/spacing'; // Get spacing from theme context

// Derive SpacingKey type from the spacing object keys
// Use a more generic approach if spacing keys might differ between themes
// type SpacingKey = keyof typeof spacing; // Removed as spacing comes from theme
type SpacingKey = keyof ReturnType<typeof useTheme>['spacing'];

// Define possible thickness values
type SeparatorThickness = 'hairline' | 'thin' | 'medium' | 'thick';

// Define component props
interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: SeparatorThickness;
  length?: DimensionValue; // Use DimensionValue for width/height
  color?: string;
  marginVertical?: SpacingKey | number;
  marginHorizontal?: SpacingKey | number;
  style?: StyleProp<ViewStyle>;
}

// Thickness mapping to pixels
const thicknessMap: Record<SeparatorThickness, number> = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  medium: 2,
  thick: 3,
};

/**
 * A visual separator line.
 */
const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  thickness = 'hairline',
  length = '100%', // Default to 100%
  color,
  marginVertical,
  marginHorizontal,
  style,
}) => {
  const { colors, spacing } = useTheme(); // Get spacing from useTheme

  // Calculate final style based on props and theme
  const separatorStyle = useMemo<ViewStyle>(() => {
    const baseStyle: ViewStyle = {
      backgroundColor: color ?? colors.border.light,
    };

    // Apply orientation-specific styles
    if (orientation === 'horizontal') {
      baseStyle.height = thicknessMap[thickness];
      baseStyle.width = length;
      if (marginVertical !== undefined) {
        // Type-safe access to spacing keys
        baseStyle.marginVertical =
          typeof marginVertical === 'string'
            ? spacing[marginVertical]
            : marginVertical;
      }
    } else {
      // Vertical
      baseStyle.width = thicknessMap[thickness];
      baseStyle.height = length;
      if (marginHorizontal !== undefined) {
        // Type-safe access to spacing keys
        baseStyle.marginHorizontal =
          typeof marginHorizontal === 'string'
            ? spacing[marginHorizontal]
            : marginHorizontal;
      }
    }

    // Align self to center by default if length is not 100%
    if (length !== '100%') {
      baseStyle.alignSelf = 'center';
    }

    return baseStyle;
  }, [
    orientation,
    thickness,
    length,
    color,
    marginVertical,
    marginHorizontal,
    colors.border.light,
    spacing, // Add spacing to dependency array
  ]);

  return <View style={[separatorStyle, style]} />;
};

export default Separator;
