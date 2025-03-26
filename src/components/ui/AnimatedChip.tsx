import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle, Easing, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Chip, { ChipProps } from './Chip';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, animation, opacity, blending } from '../../theme/styleUtils';

type AnimatedChipVariant = 'default' | 'onGradient';

interface AnimatedChipProps extends Omit<ChipProps, 'style' | 'variant'> {
  /**
   * Whether the animation is active
   */
  isAnimating: boolean;
  
  /**
   * Duration of the animation in milliseconds
   */
  animationDuration?: number;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Visual variant of the chip
   * - default: Uses background.tertiary color
   * - onGradient: Adapts colors for optimal contrast on gradient backgrounds
   */
  variant?: AnimatedChipVariant;
}

/**
 * An animated chip with progress indicator
 */
const AnimatedChip: React.FC<AnimatedChipProps> = ({
  isAnimating,
  animationDuration = animation.duration.long,
  style,
  backgroundColor,
  variant = 'default',
  textColor,
  iconColor,
  ...chipProps
}) => {
  const { colors, colorMode } = useTheme();
  const deviceColorScheme = useColorScheme();
  
  // Determine if dark mode is active
  const isDark = colorMode === 'dark' || (colorMode === 'system' && deviceColorScheme === 'dark');

  // Determine colors based on variant and theme
  const getVariantColors = () => {
    switch (variant) {
      case 'onGradient':
        const baseColor = isDark ? colors.background.primary : colors.background.card;
        return {
          background: baseColor,
          containerStyle: { 
            mixBlendMode: blending.multiply,
            opacity: 0.5,
          } as ViewStyle,
          text: isDark ? colors.text.primary : colors.text.primary,
          icon: isDark ? colors.text.primary : colors.text.primary
        };
      default:
        return {
          background: backgroundColor || colors.background.tertiary,
          containerStyle: {},
          text: textColor || colors.text.secondary,
          icon: iconColor || colors.text.secondary
        };
    }
  };

  const variantColors = getVariantColors();
  
  const [width, setWidth] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const animationInProgress = useRef(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Reset and start animation when isAnimating changes
  useEffect(() => {
    if (isAnimating && !animationInProgress.current) {
      // Start a new animation
      setShowAnimation(true);
      animationInProgress.current = true;
      progressAnim.setValue(0);
      opacityAnim.setValue(1); // Reset opacity to full
      
      // First animate the progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: animationDuration,
        easing: Easing.out(Easing.quad), // More immediate easing
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          // When progress is complete, fade out the animation layer
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 150, // Faster fade out
            easing: Easing.linear,
            useNativeDriver: false,
          }).start(({ finished: fadeDone }) => {
            if (fadeDone) {
              // Animation fully complete after fade out
              animationInProgress.current = false;
              setShowAnimation(false);
            }
          });
        }
      });
    } else if (!isAnimating && !animationInProgress.current) {
      // If no animation in progress and not speaking, hide animation
      setShowAnimation(false);
    }
  }, [isAnimating, animationDuration, progressAnim, opacityAnim]);
  
  // Calculate the progress width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });
  
  return (
    <View 
      style={[styles.outerContainer]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={[styles.container, style, variantColors.containerStyle]}>
        <Chip 
          backgroundColor={variantColors.background}
          textColor={variantColors.text}
          iconColor={variantColors.icon}
          {...chipProps} 
        />
        
        {showAnimation && (
          <Animated.View style={[styles.clipContainer, { opacity: opacityAnim }]}>
            <Animated.View 
              style={[
                styles.progressContainer,
                { width: progressWidth }
              ]}
            >
              <LinearGradient
                colors={[
                  colors.primary + opacity.lightest,
                  colors.primary + opacity.high
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignSelf: 'center',
  },
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.pill,
  },
  clipContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 2,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});

export default AnimatedChip; 