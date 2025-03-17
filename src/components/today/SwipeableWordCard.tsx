import React, { useCallback, useRef, useState } from 'react';
import { 
  StyleSheet, 
  Animated, 
  PanResponder, 
  Dimensions, 
  ViewStyle 
} from 'react-native';
import { WordOfDay } from '../../types/wordOfDay';
import WordCard, { EmptyWordCard } from './WordCard';

interface SwipeableWordCardProps {
  /**
   * Current word data
   */
  currentWord?: WordOfDay;
  
  /**
   * Whether there is a previous word available
   */
  hasPreviousWord: boolean;
  
  /**
   * Whether there is a next word available
   */
  hasNextWord: boolean;
  
  /**
   * Callback when user swipes to previous word
   */
  onPrevious: () => void;
  
  /**
   * Callback when user swipes to next word
   */
  onNext: () => void;
  
  /**
   * Additional styles for the container
   */
  style?: ViewStyle;
}

// Screen width for calculating swipe distances
const SCREEN_WIDTH = Dimensions.get('window').width;

// Threshold for triggering a swipe (as proportion of screen width)
// Reduced from 0.25 to 0.2 for more comfortable swiping
const SWIPE_THRESHOLD = 0.2;

// Velocity threshold for triggering a swipe
// Reduced from 0.5 to 0.3 for more responsive swiping
const SWIPE_VELOCITY = 0.3;

/**
 * A card component that supports horizontal swiping between words
 */
const SwipeableWordCard: React.FC<SwipeableWordCardProps> = ({
  currentWord,
  hasPreviousWord,
  hasNextWord,
  onPrevious,
  onNext,
  style
}) => {
  // Animation value for the horizontal translation
  const position = useRef(new Animated.Value(0)).current;
  
  // Track if an animation is in progress to prevent multiple swipes
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Reset position after a successful swipe or cancelled swipe
  const resetPosition = useCallback(() => {
    setIsAnimating(true);
    Animated.spring(position, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
      tension: 40, // Added for smoother spring animation
    }).start(() => {
      setIsAnimating(false);
    });
  }, [position]);
  
  // Handle swiping to previous word
  const swipeToPrevious = useCallback(() => {
    if (!hasPreviousWord || isAnimating) {
      resetPosition();
      return;
    }
    
    setIsAnimating(true);
    Animated.timing(position, {
      toValue: SCREEN_WIDTH,
      duration: 300, // Increased from 250ms for smoother animation
      useNativeDriver: true
    }).start(() => {
      onPrevious();
      position.setValue(0);
      setIsAnimating(false);
    });
  }, [hasPreviousWord, onPrevious, position, resetPosition, isAnimating]);
  
  // Handle swiping to next word
  const swipeToNext = useCallback(() => {
    if (!hasNextWord || isAnimating) {
      resetPosition();
      return;
    }
    
    setIsAnimating(true);
    Animated.timing(position, {
      toValue: -SCREEN_WIDTH,
      duration: 300, // Increased from 250ms for smoother animation
      useNativeDriver: true
    }).start(() => {
      onNext();
      position.setValue(0);
      setIsAnimating(false);
    });
  }, [hasNextWord, onNext, position, resetPosition, isAnimating]);
  
  // Set up the pan responder for handling gestures
  const panResponder = useRef(
    PanResponder.create({
      // Only become responder on horizontal movements
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only handle horizontal movements that are significant (> 10px)
        return Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      // Don't allow other responders to steal the gesture
      onMoveShouldSetPanResponderCapture: (_, gesture) => 
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      
      onPanResponderGrant: () => {
        // When touch begins, stop any ongoing animations
        position.stopAnimation();
      },
      
      onPanResponderMove: (_, gesture) => {
        // Skip if animation is already in progress
        if (isAnimating) return;
        
        // Apply resistance when swiping beyond bounds
        let newPosition = gesture.dx;
        
        if ((!hasPreviousWord && gesture.dx > 0) || 
            (!hasNextWord && gesture.dx < 0)) {
          // More resistance for better rubber-band feel
          newPosition = gesture.dx / 4;
        }
        
        position.setValue(newPosition);
      },
      
      onPanResponderRelease: (_, gesture) => {
        // Skip if animation is already in progress
        if (isAnimating) return;
        
        // Check if swipe threshold was exceeded
        if (gesture.dx > SCREEN_WIDTH * SWIPE_THRESHOLD ||
            (gesture.vx > SWIPE_VELOCITY && gesture.dx > 0)) {
          swipeToPrevious();
        } else if (gesture.dx < -SCREEN_WIDTH * SWIPE_THRESHOLD ||
                  (gesture.vx < -SWIPE_VELOCITY && gesture.dx < 0)) {
          swipeToNext();
        } else {
          resetPosition();
        }
      },
      
      // If another component tries to capture the responder, reset position
      onPanResponderTerminate: () => {
        resetPosition();
      }
    })
  ).current;
  
  // Calculate the rotation based on the position
  // This adds a subtle rotation effect during swiping
  const rotate = position.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['2deg', '0deg', '-2deg'],
    extrapolate: 'clamp'
  });
  
  // Calculate the opacity of the card edges to indicate direction
  const leftEdgeOpacity = position.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 0.5],
    extrapolate: 'clamp'
  });
  
  const rightEdgeOpacity = position.interpolate({
    inputRange: [-50, 0],
    outputRange: [0.5, 0],
    extrapolate: 'clamp'
  });
  
  // Calculate scale effect to provide visual feedback during swipe
  const scale = position.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0.96, 1, 0.96],
    extrapolate: 'clamp'
  });
  
  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [
            { translateX: position },
            { rotate },
            { scale }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {currentWord ? (
        <WordCard wordData={currentWord} />
      ) : (
        <EmptyWordCard />
      )}
      
      {/* Edge indicators */}
      <Animated.View 
        style={[
          styles.leftEdge,
          { opacity: leftEdgeOpacity }
        ]} 
        pointerEvents="none"
      />
      <Animated.View 
        style={[
          styles.rightEdge,
          { opacity: rightEdgeOpacity }
        ]} 
        pointerEvents="none"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    // Increased touch area by adding padding
    paddingHorizontal: 12,
    // Center the card
    alignSelf: 'center',
  },
  leftEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  rightEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
});

export default SwipeableWordCard; 