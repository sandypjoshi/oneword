import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  ActivityIndicator, 
  View, 
  AccessibilityState,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, applyElevation, components } from '../../theme/styleUtils';
import spacing from '../../theme/spacing';
import Text from './Text';
import typography from '../../theme/typography';

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

// Button sizes
type ButtonSize = 'small' | 'medium' | 'large';

// Component props
interface ButtonProps {
  // Content
  title?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Appearance
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  
  // State
  disabled?: boolean;
  loading?: boolean;
  
  // Event handlers
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  
  // Additional styles
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'header' | 'none';
}

/**
 * Button component
 * 
 * A versatile button component that supports various visual styles,
 * states, and accessibility features.
 */
export default function Button({
  // Content
  title,
  leftIcon,
  rightIcon,
  
  // Appearance
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  
  // State
  disabled = false,
  loading = false,
  
  // Event handlers
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  
  // Additional styles
  style,
  contentStyle,
  
  // Accessibility
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}: ButtonProps) {
  // Access theme context
  const { colors } = useTheme();
  
  // Get component tokens
  const buttonTokens = components.button;
  
  // Get text variant based on button size
  const textVariant = size === 'small' ? 'buttonSmall' : 'button';
  
  // Generate accessibility state
  const accessibilityState: AccessibilityState = {
    disabled: disabled || loading,
    busy: loading,
  };
  
  // Generate styles based on props
  const getContainerStyle = (): ViewStyle => {
    // Base styles for all variants
    const baseStyle: ViewStyle = {
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      height: buttonTokens.height[size],
      minWidth: buttonTokens.minWidth[size],
      paddingHorizontal: buttonTokens.padding[size].x,
      paddingVertical: 0, // Remove vertical padding to use fixed height
      ...applyElevation('sm', colors.text.primary),
    };
    
    // Width styles
    if (fullWidth) {
      baseStyle.width = '100%';
    }
    
    // Variant-specific styles
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
        
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.primaryLight,
          borderColor: colors.primaryLight,
        };
        
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border.focus,
          ...applyElevation('none'),
        };
        
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          ...applyElevation('none'),
        };
        
      default:
        return baseStyle;
    }
  };
  
  // Get text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.text.inverse;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.text.inverse;
    }
  };
  
  // Render loading indicator
  const renderLoadingIndicator = () => (
    <ActivityIndicator 
      size="small" 
      color={['outline', 'ghost'].includes(variant) ? colors.primary : colors.text.inverse} 
    />
  );
  
  // Render button content
  const renderContent = () => {
    if (loading) {
      return renderLoadingIndicator();
    }
    
    return (
      <View style={[styles.contentContainer, contentStyle]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        {title && (
          <Text
            variant={textVariant}
            style={{
              textAlign: 'center',
            }}
            color={getTextColor()}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        )}
        
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
    );
  };
  
  return (
    <TouchableOpacity
      style={[
        getContainerStyle(),
        (disabled && !loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onLongPress={onLongPress}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
}); 