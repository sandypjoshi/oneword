import React, { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  StyleProp,
  Platform,
  PanResponder,
  View,
  Text as RNText,
  Animated
} from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { radius, borderWidth } from '../../theme/styleUtils';
import { useColorScheme } from 'react-native';
import { FONT_SIZES } from '../../theme/typography';

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled';

// State lookup sets for easier maintenance
const BORDER_STATES = new Set(['selected', 'correct', 'incorrect', 'disabled']);
const BOLD_STATES = new Set(['selected', 'correct']);

// Configuration for swipe detection
const SWIPE_THRESHOLD = 10; // Minimum distance to be considered a swipe
const PRESS_DELAY = 100; // Small delay to distinguish between taps and swipes (in ms)

// Minimum button height to prevent tiny buttons
const MIN_BUTTON_HEIGHT = 46;

// Character threshold for font size reduction
const TEXT_LENGTH_THRESHOLD = 30;

// Shake animation configuration
const SHAKE_DURATION = 250; // Shorter total duration for snappier feel
const SHAKE_COUNT = 4; // Slightly more shakes in less time
const SHAKE_INTENSITY = 8; // Slightly more intense movement

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

  /**
   * Force using small font size regardless of text length
   * Useful when displaying multiple options to maintain consistent appearance
   */
  forceSmallFont?: boolean;
}

/**
 * Get background color based on state
 */
const getBackgroundColor = (state: OptionState, colors: any, colorScheme: 'light' | 'dark') => {
  const isDark = colorScheme === 'dark';
  switch (state) {
    case 'selected':
      return colors.background.selected;
    case 'correct':
      return colors.background.success;
    case 'incorrect':
      return colors.background.error;
    case 'disabled':
      return colors.background.disabled;
    default:
      // Use active background for better consistency and contrast in both modes
      return colors.background.active;
  }
};

/**
 * Get border color based on state
 */
const getBorderColor = (state: OptionState, colors: any, colorScheme: 'light' | 'dark') => {
  const isDark = colorScheme === 'dark';
  switch (state) {
    case 'selected':
      return colors.border.focus;
    case 'correct':
      return colors.border.success;
    case 'incorrect':
      return colors.border.error;
    case 'disabled':
      return colors.border.disabled;
    default:
      // Use a lighter border for default state
      return colors.border.light;
  }
};

/**
 * Get text color based on state
 */
const getTextColor = (state: OptionState, colors: any, colorScheme: 'light' | 'dark') => {
  const isDark = colorScheme === 'dark';
  switch (state) {
    case 'selected':
      return colors.text.info;
    case 'correct':
      return colors.text.success;
    case 'incorrect':
      return colors.text.error;
    case 'disabled':
      return colors.text.disabled;
    default:
      // Use secondary text color for better contrast on darker background
      return isDark ? colors.text.primary : colors.text.secondary;
  }
};

/**
 * Custom button for word definition options
 */
const OptionButtonComponent: React.FC<OptionButtonProps> = ({
  label,
  state: propState = 'default',
  disabled = false,
  onPress,
  style,
  forceSmallFont = false
}) => {
  const { colors, spacing, typography } = useTheme();
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  
  // Animation value for shake effect
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  // Get the font size based on typography sizes
  const normalFontSize = FONT_SIZES.md; // bodyMedium size
  const minFontSize = FONT_SIZES.sm;    // bodySmall size
  
  // Determine effective state (if disabled but not in a result state, use 'disabled' state)
  const state = disabled && !['correct', 'incorrect'].includes(propState) 
    ? 'disabled' 
    : propState;
  
  // Determine if button should have border
  const hasBorder = BORDER_STATES.has(state) || state === 'default';
  
  // Determine if text should be bold - not for disabled state
  const isBold = BOLD_STATES.has(state);
  
  // Check if text exceeds length threshold or if small font is forced
  const shouldUseSmallFont = forceSmallFont || label.length > TEXT_LENGTH_THRESHOLD;
  
  // Refs for touch handling
  const isMovingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  
  // Previous state ref to detect changes
  const prevStateRef = useRef<OptionState>(propState);
  
  // Shake animation function
  const startShakeAnimation = useCallback(() => {
    // Reset animation value
    shakeAnimation.setValue(0);
    
    // Create shake sequence with easing
    Animated.sequence([
      // First shake is more pronounced
      Animated.timing(shakeAnimation, {
        toValue: SHAKE_INTENSITY,
        duration: SHAKE_DURATION / (SHAKE_COUNT * 2),
        useNativeDriver: true,
        easing: (t) => Math.sin(t * Math.PI), // Smoother start and end
      }),
      Animated.timing(shakeAnimation, {
        toValue: -SHAKE_INTENSITY,
        duration: SHAKE_DURATION / (SHAKE_COUNT * 2),
        useNativeDriver: true,
        easing: (t) => Math.sin(t * Math.PI),
      }),
      
      // Subsequent shakes decrease in intensity
      ...Array(SHAKE_COUNT - 1).fill(0).flatMap((_, i) => {
        const decayFactor = 1 - ((i + 1) / SHAKE_COUNT);
        const intensity = SHAKE_INTENSITY * decayFactor;
        
        return [
          Animated.timing(shakeAnimation, {
            toValue: intensity,
            duration: SHAKE_DURATION / (SHAKE_COUNT * 2.5),
            useNativeDriver: true,
            easing: (t) => Math.sin(t * Math.PI),
          }),
          Animated.timing(shakeAnimation, {
            toValue: -intensity,
            duration: SHAKE_DURATION / (SHAKE_COUNT * 2.5),
            useNativeDriver: true,
            easing: (t) => Math.sin(t * Math.PI),
          }),
        ];
      }),
      
      // End at center position with a gentler finish
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: SHAKE_DURATION / (SHAKE_COUNT * 3),
        useNativeDriver: true,
        easing: (t) => Math.sin(t * Math.PI / 2), // Ease out
      }),
    ]).start();
  }, [shakeAnimation]);
  
  // Trigger shake animation when state changes to 'incorrect'
  useEffect(() => {
    if (state === 'incorrect' && prevStateRef.current !== 'incorrect') {
      startShakeAnimation();
    }
    prevStateRef.current = state;
  }, [state, startShakeAnimation]);
  
  // Create PanResponder for touch handling
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      isMovingRef.current = false;
      setIsPressed(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    onPanResponderMove: (_, gestureState) => {
      // If moved more than threshold in any direction, flag as moving
      if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD || 
          Math.abs(gestureState.dy) > SWIPE_THRESHOLD) {
        isMovingRef.current = true;
        setIsPressed(false);
      }
    },
    onPanResponderRelease: () => {
      // Only trigger press if it wasn't a swipe
      if (!isMovingRef.current && onPress && !disabled && 
          !['correct', 'incorrect'].includes(state)) {
        // Add a small delay before executing press
        timeoutRef.current = setTimeout(() => {
          onPress();
        }, PRESS_DELAY);
      }
      
      // Reset flag
      isMovingRef.current = false;
      setIsPressed(false);
    },
    onPanResponderTerminate: () => {
      isMovingRef.current = false;
      setIsPressed(false);
      
      // Clear timeout if interaction is terminated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }), [onPress, disabled, state]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Memoize the styles to prevent recalculation on every render
  const buttonStyles = useMemo(() => ({
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
      width: '100%' as const,
      minHeight: MIN_BUTTON_HEIGHT,
      backgroundColor: getBackgroundColor(state, colors, colorScheme),
      borderColor: getBorderColor(state, colors, colorScheme),
      borderWidth: hasBorder ? (state === 'default' ? borderWidth.hairline : borderWidth.hairline) : borderWidth.none,
      opacity: isPressed ? 0.7 : 1,
      justifyContent: 'center' as const,
    },
    text: {
      textTransform: 'lowercase' as const,
      paddingVertical: spacing.xs,
    }
  }), [state, colors, spacing, colorScheme, hasBorder, isPressed]);
  
  // Get text color based on state
  const textColor = getTextColor(state, colors, colorScheme);
  
  // Apply shake animation transform
  const animatedStyle = {
    transform: [{ translateX: shakeAnimation }]
  };
  
  return (
    <View {...panResponder.panHandlers}>
      <Animated.View
        style={[buttonStyles.container, animatedStyle, style]}
      >
        <RNText
          style={[
            buttonStyles.text,
            {
              color: textColor,
              fontWeight: isBold ? "700" : "400",
              fontSize: normalFontSize,
              fontFamily: isBold ? typography.fonts.systemBold : typography.fonts.system,
              textAlign: 'center',
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={minFontSize / normalFontSize}
        >
          {label}
        </RNText>
      </Animated.View>
    </View>
  );
};

// Apply memo to prevent unnecessary re-renders
const OptionButton = memo(OptionButtonComponent);

// Set display name with state for better debugging
OptionButton.displayName = 'OptionButton';

export default OptionButton; 