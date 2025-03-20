import React, { memo } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  View, 
  ViewStyle,
  StyleProp 
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../ui';
import { radius } from '../../theme/styleUtils';

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

interface OptionButtonProps {
  /**
   * Text content of the option
   */
  label: string;
  
  /**
   * Current state of the option
   */
  state?: OptionState;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Function called when the option is pressed
   */
  onPress?: () => void;
  
  /**
   * Additional style for the container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Custom button for word definition options
 */
const OptionButtonComponent: React.FC<OptionButtonProps> = ({
  label,
  state = 'default',
  disabled = false,
  onPress,
  style
}) => {
  const { colors, spacing, isDark } = useTheme();
  
  // Determine background color based on state
  const getBackgroundColor = () => {
    switch (state) {
      case 'selected':
        return colors.primary + '15'; // Using opacity for selected state
      case 'correct':
        return colors.success + '15'; // Using opacity for success background
      case 'incorrect':
        return colors.error + '15'; // Using opacity for error background
      default:
        return colors.background.tertiary;
    }
  };
  
  // Determine border color based on state
  const getBorderColor = () => {
    switch (state) {
      case 'selected':
        return colors.primary;
      case 'correct':
        return colors.success;
      case 'incorrect':
        return colors.error;
      default:
        return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    }
  };
  
  // Determine text color based on state
  const getTextColor = () => {
    switch (state) {
      case 'selected':
        return colors.primary;
      case 'correct':
        return colors.success;
      case 'incorrect':
        return colors.error;
      default:
        return colors.text.primary;
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          marginBottom: spacing.sm,
          width: '100%',
          backgroundColor: getBackgroundColor(),
          borderWidth: 0,
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled || state === 'correct' || state === 'incorrect'}
      activeOpacity={0.7}
    >
      <Text
        variant="bodyMedium"
        weight={state !== 'default' ? "600" : "400"}
        color={getTextColor()}
        align="center"
        style={{ 
          textTransform: 'lowercase',
          paddingVertical: spacing.xs 
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Apply memo to prevent unnecessary re-renders
const OptionButton = memo(OptionButtonComponent);

// Set display name for better debugging
OptionButton.displayName = 'OptionButton';

export default OptionButton; 