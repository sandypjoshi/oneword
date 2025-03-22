import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius } from '../../theme/styleUtils';
import { IconName } from './Icon';
import Icon from './Icon';
import Text from './Text';

export type ChipSize = 'small' | 'medium' | 'large';
export type ChipVariant = 'default' | 'outlined' | 'filled';

export interface ChipProps {
  /**
   * Text content of the chip
   */
  label: string;
  
  /**
   * Optional icon to display before the text
   */
  iconLeft?: IconName;
  
  /**
   * Optional icon to display after the text
   */
  iconRight?: IconName;
  
  /**
   * Size of the chip
   */
  size?: ChipSize;
  
  /**
   * Visual variant of the chip
   */
  variant?: ChipVariant;
  
  /**
   * Function called when the chip is pressed
   */
  onPress?: () => void;
  
  /**
   * Whether the chip is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Additional styles for the text
   */
  textStyle?: StyleProp<TextStyle>;
  
  /**
   * Custom background color for the chip
   */
  backgroundColor?: string;
  
  /**
   * Custom text color for the chip
   */
  textColor?: string;
  
  /**
   * Custom border color for the chip
   */
  borderColor?: string;
  
  /**
   * Size of the icons
   */
  iconSize?: number;
  
  /**
   * Custom icon color
   */
  iconColor?: string;
  
  /**
   * Active opacity when pressed
   */
  activeOpacity?: number;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * A versatile chip component that can be used for tags, filters, actions, etc.
 */
const Chip: React.FC<ChipProps> = ({
  label,
  iconLeft,
  iconRight,
  size = 'medium',
  variant = 'default',
  onPress,
  disabled = false,
  style,
  textStyle,
  backgroundColor,
  textColor,
  borderColor,
  iconSize,
  iconColor,
  activeOpacity = 0.7,
  testID,
}) => {
  const { colors, spacing } = useTheme();
  
  // Determine sizes based on the size prop
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: 14,
          iconSize: 16,
        };
      case 'large':
        return {
          paddingHorizontal: spacing.xxl,
          paddingVertical: spacing.md,
          fontSize: 18,
          iconSize: 20,
        };
      case 'medium':
      default:
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          fontSize: 16,
          iconSize: 18,
        };
    }
  };
  
  // Get styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: borderColor || colors.border.medium,
          borderWidth: 1,
          textColor: textColor || colors.text.secondary,
        };
      case 'filled':
        return {
          backgroundColor: backgroundColor || colors.primary,
          borderColor: 'transparent',
          borderWidth: 0,
          textColor: textColor || colors.text.inverse,
        };
      case 'default':
      default:
        return {
          backgroundColor: backgroundColor || colors.background.tertiary,
          borderColor: 'transparent',
          borderWidth: 0,
          textColor: textColor || colors.text.secondary,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const finalIconSize = iconSize || sizeStyles.iconSize;
  const finalIconColor = iconColor || variantStyles.textColor;
  
  // Determine if the chip is interactive
  const isInteractive = typeof onPress === 'function' && !disabled;
  
  // Create the chip content
  const renderContent = () => (
    <>
      {iconLeft && (
        <View style={styles.iconLeft}>
          <Icon 
            name={iconLeft} 
            size={finalIconSize} 
            color={finalIconColor}
          />
        </View>
      )}
      
      <Text
        variant={size === 'small' ? 'caption' : size === 'large' ? 'bodyLarge' : 'bodyMedium'}
        color={variantStyles.textColor}
        style={textStyle}
        numberOfLines={1}
      >
        {label}
      </Text>
      
      {iconRight && (
        <View style={styles.iconRight}>
          <Icon 
            name={iconRight} 
            size={finalIconSize} 
            color={finalIconColor}
          />
        </View>
      )}
    </>
  );
  
  // Use TouchableOpacity if the chip is interactive, View otherwise
  const ChipContainer = isInteractive ? TouchableOpacity : View;
  const interactiveProps = isInteractive 
    ? { 
        onPress, 
        activeOpacity,
        disabled,
      } 
    : {};
  
  return (
    <ChipContainer
      testID={testID}
      style={[
        styles.container,
        {
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
          borderRadius: radius.pill,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...interactiveProps}
    >
      {renderContent()}
    </ChipContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Chip; 