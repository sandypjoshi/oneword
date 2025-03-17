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
  const { spacing } = useTheme();

  const getSpacingValue = (value: SpacingKey | number | undefined) => {
    if (value === undefined) return undefined;
    return typeof value === 'number' ? value : spacing[value];
  };

  // Use useMemo to prevent recreating styles on every render
  const boxStyles = useMemo(() => {
    return StyleSheet.create({
      box: {
        padding: getSpacingValue(padding),
        paddingTop: getSpacingValue(paddingTop),
        paddingBottom: getSpacingValue(paddingBottom),
        paddingLeft: getSpacingValue(paddingLeft),
        paddingRight: getSpacingValue(paddingRight),
        paddingVertical: getSpacingValue(paddingVertical),
        paddingHorizontal: getSpacingValue(paddingHorizontal),
        margin: getSpacingValue(margin),
        marginTop: getSpacingValue(marginTop),
        marginBottom: getSpacingValue(marginBottom),
        marginLeft: getSpacingValue(marginLeft),
        marginRight: getSpacingValue(marginRight),
        marginVertical: getSpacingValue(marginVertical),
        marginHorizontal: getSpacingValue(marginHorizontal),
        backgroundColor: bg,
        flex: flex,
        width: width as DimensionValue,
        height: height as DimensionValue,
        alignItems: align,
        justifyContent: justify,
        flexDirection: direction,
        flexWrap: wrap,
        gap: getSpacingValue(gap),
        borderRadius: radius,
      },
    });
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