import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Chip, { ChipProps } from './Chip';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, animation, opacity } from '../../theme/styleUtils';

interface AnimatedChipProps extends Omit<ChipProps, 'style'> {
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
}

/**
 * An animated chip with progress indicator
 */
const AnimatedChip: React.FC<AnimatedChipProps> = ({
  isAnimating,
  animationDuration = animation.duration.longer,
  style,
  backgroundColor,
  ...chipProps
}) => {
  const { colors } = useTheme();
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
        easing: Easing.bezier(...animation.easing.sharp), // Use token for easing
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          // When progress is complete, fade out the animation layer
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: animation.duration.shortest, // Use token for fade duration
            easing: Easing.linear, // Simple linear fade
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
      style={styles.container}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Chip 
        style={style}
        backgroundColor={backgroundColor}
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
                colors.primary + opacity.lightest, // Use tokens for opacity values
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  clipContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    borderRadius: radius.pill,
    overflow: 'hidden',
    zIndex: 2,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});

export default AnimatedChip; 