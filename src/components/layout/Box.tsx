/**
 * Box component for themed layouts
 * A wrapper around View with theme-aware styling using theme tokens.
 */

import React, { useMemo } from 'react';
import { View, ViewProps, StyleSheet, StyleProp, ViewStyle, FlexStyle } from 'react-native';
import { useTheme, ThemeContextType } from '../../theme/ThemeProvider';
import baseSpacing from '../../theme/spacing'; // Import the actual spacing tokens

// Define keys from the theme context we'll use dynamically
type SpacingKeys = keyof ThemeContextType['spacing'];
type ColorKeys = keyof ThemeContextType['colors']; // Base keys like 'primary', 'error', etc.
// Define semantic color keys (nested keys) dynamically if possible, otherwise list common ones
// Note: Fully dynamic nested keyof is complex, listing main categories is often sufficient
type BackgroundColorKeys = keyof ThemeContextType['colors']['background'];
type TextColorKeys = keyof ThemeContextType['colors']['text']; // Included for completeness
type BorderColorKeys = keyof ThemeContextType['colors']['border'];

// Create a type for combined color keys for easier prop definition
// Allows using dot notation like "background.primary"
type ThemeColorPath = 
  | ColorKeys 
  | `background.${BackgroundColorKeys}`
  | `text.${TextColorKeys}` 
  | `border.${BorderColorKeys}`;

// Define the extended props for the Box component
interface BoxProps extends ViewProps {
  flex?: FlexStyle['flex'];
  flexDirection?: FlexStyle['flexDirection'];
  alignItems?: FlexStyle['alignItems'];
  justifyContent?: FlexStyle['justifyContent'];
  flexWrap?: FlexStyle['flexWrap'];
  flexGrow?: FlexStyle['flexGrow'];
  flexShrink?: FlexStyle['flexShrink'];
  flexBasis?: FlexStyle['flexBasis'];
  gap?: SpacingKeys | number; // Added gap prop

  padding?: SpacingKeys | number;
  paddingHorizontal?: SpacingKeys | number;
  paddingVertical?: SpacingKeys | number;
  paddingTop?: SpacingKeys | number;
  paddingBottom?: SpacingKeys | number;
  paddingLeft?: SpacingKeys | number;
  paddingRight?: SpacingKeys | number;
  paddingStart?: SpacingKeys | number;
  paddingEnd?: SpacingKeys | number;

  margin?: SpacingKeys | number;
  marginHorizontal?: SpacingKeys | number;
  marginVertical?: SpacingKeys | number;
  marginTop?: SpacingKeys | number;
  marginBottom?: SpacingKeys | number;
  marginLeft?: SpacingKeys | number;
  marginRight?: SpacingKeys | number;
  marginStart?: SpacingKeys | number;
  marginEnd?: SpacingKeys | number;

  backgroundColor?: ThemeColorPath; // Use the combined color path type
  borderColor?: ThemeColorPath;     // Use the combined color path type
  borderWidth?: number;
  borderRadius?: SpacingKeys | number; // Allow theme tokens for border radius
  borderTopLeftRadius?: SpacingKeys | number;
  borderTopRightRadius?: SpacingKeys | number;
  borderBottomLeftRadius?: SpacingKeys | number;
  borderBottomRightRadius?: SpacingKeys | number;

  width?: FlexStyle['width'];
  height?: FlexStyle['height'];
  minWidth?: FlexStyle['minWidth'];
  minHeight?: FlexStyle['minHeight'];
  maxWidth?: FlexStyle['maxWidth'];
  maxHeight?: FlexStyle['maxHeight'];

  position?: FlexStyle['position'];
  top?: FlexStyle['top'];
  bottom?: FlexStyle['bottom'];
  left?: FlexStyle['left'];
  right?: FlexStyle['right'];

  overflow?: FlexStyle['overflow'];
  opacity?: number;
}

// Helper function to safely access nested theme color values
const getColorValue = (colors: ThemeContextType['colors'], colorPath: ThemeColorPath | undefined): string | undefined => {
  if (!colorPath) return undefined;
  
  const pathSegments = colorPath.split('.');
  let value: any = colors;
  
  for (const segment of pathSegments) {
    // Check if value is an object and has the segment as a key
    if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, segment)) {
      value = value[segment as keyof typeof value];
    } else {
      // Path is invalid or doesn't exist in the theme
      console.warn(`[Box] Color path "${colorPath}" not found in theme.`);
      return undefined; // Return undefined if path is invalid
    }
  }
  
  // Ensure the final value is a string before returning
  return typeof value === 'string' ? value : undefined;
};

// Helper function to get spacing value from theme key or use raw number
const getSpacingValue = (spacing: ThemeContextType['spacing'], value: SpacingKeys | number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  // Check if the key exists in the theme spacing object
  if (spacing && Object.prototype.hasOwnProperty.call(spacing, value)) {
    return spacing[value as SpacingKeys];
  }
  console.warn(`[Box] Spacing key "${value}" not found in theme.`);
  return undefined; // Return undefined if key is invalid
};

const Box: React.FC<BoxProps> = ({
  children,
  style,
  // Destructure all theme-related props
  flex,
  flexDirection,
  alignItems,
  justifyContent,
  flexWrap,
  flexGrow,
  flexShrink,
  flexBasis,
  gap,
  padding,
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  paddingStart,
  paddingEnd,
  margin,
  marginHorizontal,
  marginVertical,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  marginStart,
  marginEnd,
  backgroundColor,
  borderColor,
  borderWidth,
  borderRadius,
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  position,
  top,
  bottom,
  left,
  right,
  overflow,
  opacity,
  ...rest // Pass remaining ViewProps
}) => {
  // Get the full theme context
  const theme = useTheme();
  const { colors, spacing } = theme;

  // Use useMemo to compute the style object only when props change
  const themedStyle = useMemo(() => {
    const computedStyle: ViewStyle = {};

    // Helper to add style only if value is defined
    const addStyle = (key: keyof ViewStyle, value: any) => {
      if (value !== undefined) {
        // @ts-ignore - Allow assigning potentially incorrect types temporarily, validation is done by helpers
        computedStyle[key] = value;
      }
    };

    // Apply layout props
    addStyle('flex', flex);
    addStyle('flexDirection', flexDirection);
    addStyle('alignItems', alignItems);
    addStyle('justifyContent', justifyContent);
    addStyle('flexWrap', flexWrap);
    addStyle('flexGrow', flexGrow);
    addStyle('flexShrink', flexShrink);
    addStyle('flexBasis', flexBasis);
    addStyle('gap', getSpacingValue(spacing, gap));

    // Apply padding props
    addStyle('padding', getSpacingValue(spacing, padding));
    addStyle('paddingHorizontal', getSpacingValue(spacing, paddingHorizontal));
    addStyle('paddingVertical', getSpacingValue(spacing, paddingVertical));
    addStyle('paddingTop', getSpacingValue(spacing, paddingTop));
    addStyle('paddingBottom', getSpacingValue(spacing, paddingBottom));
    addStyle('paddingLeft', getSpacingValue(spacing, paddingLeft));
    addStyle('paddingRight', getSpacingValue(spacing, paddingRight));
    addStyle('paddingStart', getSpacingValue(spacing, paddingStart));
    addStyle('paddingEnd', getSpacingValue(spacing, paddingEnd));
    
    // Apply margin props
    addStyle('margin', getSpacingValue(spacing, margin));
    addStyle('marginHorizontal', getSpacingValue(spacing, marginHorizontal));
    addStyle('marginVertical', getSpacingValue(spacing, marginVertical));
    addStyle('marginTop', getSpacingValue(spacing, marginTop));
    addStyle('marginBottom', getSpacingValue(spacing, marginBottom));
    addStyle('marginLeft', getSpacingValue(spacing, marginLeft));
    addStyle('marginRight', getSpacingValue(spacing, marginRight));
    addStyle('marginStart', getSpacingValue(spacing, marginStart));
    addStyle('marginEnd', getSpacingValue(spacing, marginEnd));

    // Apply color props
    addStyle('backgroundColor', getColorValue(colors, backgroundColor));
    addStyle('borderColor', getColorValue(colors, borderColor));

    // Apply border props
    addStyle('borderWidth', borderWidth);
    addStyle('borderRadius', getSpacingValue(spacing, borderRadius)); // Use spacing for radius too
    addStyle('borderTopLeftRadius', getSpacingValue(spacing, borderTopLeftRadius));
    addStyle('borderTopRightRadius', getSpacingValue(spacing, borderTopRightRadius));
    addStyle('borderBottomLeftRadius', getSpacingValue(spacing, borderBottomLeftRadius));
    addStyle('borderBottomRightRadius', getSpacingValue(spacing, borderBottomRightRadius));

    // Apply dimension props
    addStyle('width', width);
    addStyle('height', height);
    addStyle('minWidth', minWidth);
    addStyle('minHeight', minHeight);
    addStyle('maxWidth', maxWidth);
    addStyle('maxHeight', maxHeight);
    
    // Apply position props
    addStyle('position', position);
    addStyle('top', top);
    addStyle('bottom', bottom);
    addStyle('left', left);
    addStyle('right', right);

    // Apply other style props
    addStyle('overflow', overflow);
    addStyle('opacity', opacity);

    return computedStyle;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Include all props that affect the style + theme objects
    flex, flexDirection, alignItems, justifyContent, flexWrap, flexGrow, flexShrink, flexBasis, gap,
    padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight, paddingStart, paddingEnd,
    margin, marginHorizontal, marginVertical, marginTop, marginBottom, marginLeft, marginRight, marginStart, marginEnd,
    backgroundColor, borderColor, borderWidth, borderRadius, borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius,
    width, height, minWidth, minHeight, maxWidth, maxHeight,
    position, top, bottom, left, right,
    overflow, opacity,
    colors, spacing // Theme objects dependency
  ]);

  return (
    <View
      style={[themedStyle, style]} // Apply themed styles first, then custom styles
      {...rest}
    >
      {children}
    </View>
  );
};

export default Box; 