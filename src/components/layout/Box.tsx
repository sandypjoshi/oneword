import React, { useMemo } from 'react';
import { View, ViewProps, StyleSheet, DimensionValue } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type SpacingKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface BoxProps extends ViewProps {
  padding?: SpacingKey | number;
  paddingTop?: SpacingKey | number;
  paddingBottom?: SpacingKey | number;
  paddingLeft?: SpacingKey | number;
  paddingRight?: SpacingKey | number;
  paddingVertical?: SpacingKey | number;
  paddingHorizontal?: SpacingKey | number;
  margin?: SpacingKey | number;
  marginTop?: SpacingKey | number;
  marginBottom?: SpacingKey | number;
  marginLeft?: SpacingKey | number;
  marginRight?: SpacingKey | number;
  marginVertical?: SpacingKey | number;
  marginHorizontal?: SpacingKey | number;
  bg?: string;
  flex?: number;
  width?: number | string;
  height?: number | string;
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  gap?: SpacingKey | number;
  radius?: number;
}

// Default spacing values as fallback
const DEFAULT_SPACING = {
  xs: 4,
  sm: 8, 
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

const Box = ({
  children,
  style,
  padding,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  paddingVertical,
  paddingHorizontal,
  margin,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  marginVertical,
  marginHorizontal,
  bg,
  flex,
  width,
  height,
  align,
  justify,
  direction,
  wrap,
  gap,
  radius,
  ...rest
}: BoxProps) => {
  const theme = useTheme();
  const spacing = theme?.spacing || DEFAULT_SPACING;

  const getSpacingValue = (value: SpacingKey | number | undefined): number | undefined => {
    if (value === undefined) return undefined;
    
    if (typeof value === 'number') {
      return value;
    }
    
    // Safely access spacing with fallback
    return spacing[value] !== undefined ? spacing[value] : DEFAULT_SPACING[value];
  };

  // Use useMemo to prevent recreating styles on every render
  const boxStyles = useMemo(() => {
    try {
      // Create a safe style object
      const safeStyles: Record<string, any> = {};
      
      // Only add defined values to the style object
      const addStyleIfDefined = (key: string, value: any) => {
        if (value !== undefined) {
          safeStyles[key] = value;
        }
      };
      
      // Add all the spacing properties safely
      addStyleIfDefined('padding', getSpacingValue(padding));
      addStyleIfDefined('paddingTop', getSpacingValue(paddingTop));
      addStyleIfDefined('paddingBottom', getSpacingValue(paddingBottom));
      addStyleIfDefined('paddingLeft', getSpacingValue(paddingLeft));
      addStyleIfDefined('paddingRight', getSpacingValue(paddingRight));
      addStyleIfDefined('paddingVertical', getSpacingValue(paddingVertical));
      addStyleIfDefined('paddingHorizontal', getSpacingValue(paddingHorizontal));
      addStyleIfDefined('margin', getSpacingValue(margin));
      addStyleIfDefined('marginTop', getSpacingValue(marginTop));
      addStyleIfDefined('marginBottom', getSpacingValue(marginBottom));
      addStyleIfDefined('marginLeft', getSpacingValue(marginLeft));
      addStyleIfDefined('marginRight', getSpacingValue(marginRight));
      addStyleIfDefined('marginVertical', getSpacingValue(marginVertical));
      addStyleIfDefined('marginHorizontal', getSpacingValue(marginHorizontal));
      addStyleIfDefined('gap', getSpacingValue(gap));
      
      // Add other style properties
      addStyleIfDefined('backgroundColor', bg);
      addStyleIfDefined('flex', flex);
      addStyleIfDefined('width', width);
      addStyleIfDefined('height', height);
      addStyleIfDefined('alignItems', align);
      addStyleIfDefined('justifyContent', justify);
      addStyleIfDefined('flexDirection', direction);
      addStyleIfDefined('flexWrap', wrap);
      addStyleIfDefined('borderRadius', radius);
      
      return StyleSheet.create({ box: safeStyles });
    } catch (error) {
      console.warn('Error creating Box styles:', error);
      // Return empty styles as fallback
      return StyleSheet.create({ box: {} });
    }
  }, [
    spacing, padding, paddingTop, paddingBottom, paddingLeft, paddingRight,
    paddingVertical, paddingHorizontal, margin, marginTop, marginBottom,
    marginLeft, marginRight, marginVertical, marginHorizontal, bg, flex,
    width, height, align, justify, direction, wrap, gap, radius
  ]);

  return (
    <View style={[boxStyles.box, style]} {...rest}>
      {children}
    </View>
  );
};

export default Box; 