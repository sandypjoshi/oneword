import React, { useCallback, useRef } from 'react';
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
const SWIPE_THRESHOLD = 0.25;

// Velocity threshold for triggering a swipe
const SWIPE_VELOCITY = 0.5;

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
  
  // Reset position after a successful swipe
  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5
    }).start();
  }, [position]);
  
  // Handle swiping to previous word
  const swipeToPrevious = useCallback(() => {
    if (!hasPreviousWord) {
      resetPosition();
      return;
    }
    
    Animated.timing(position, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      onPrevious();
      position.setValue(0);
    });
  }, [hasPreviousWord, onPrevious, position, resetPosition]);
  
  // Handle swiping to next word
  const swipeToNext = useCallback(() => {
    if (!hasNextWord) {
      resetPosition();
      return;
    }
    
    Animated.timing(position, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      onNext();
      position.setValue(0);
    });
  }, [hasNextWord, onNext, position, resetPosition]);
  
  // Set up the pan responder for handling gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        // Apply resistance when swiping beyond bounds
        let newPosition = gesture.dx;
        
        if ((!hasPreviousWord && gesture.dx > 0) || 
            (!hasNextWord && gesture.dx < 0)) {
          newPosition = gesture.dx / 3; // Add resistance
        }
        
        position.setValue(newPosition);
      },
      onPanResponderRelease: (_, gesture) => {
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
  
  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [
            { translateX: position },
            { rotate }
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