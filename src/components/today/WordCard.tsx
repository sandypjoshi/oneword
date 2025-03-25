import React, { memo, useCallback, useEffect } from 'react';
import { StyleProp, ViewStyle, View, Dimensions, Platform } from 'react-native';
import { WordOfDay } from '../../types/wordOfDay';
import WordCardQuestion from './WordCardQuestion';
import WordCardAnswer from './WordCardAnswer';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { useCardStore } from '../../store/cardStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import spacing from '../../theme/spacing';

// Get screen dimensions to calculate responsive card size
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - (spacing.screenPadding * 2), 400); // Max width of 400, respecting screen padding

interface WordCardProps {
  /**
   * Word data to display
   */
  wordData: WordOfDay;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Function called when the details button is pressed
   */
  onViewDetails?: () => void;
}

/**
 * Card component that displays a word of the day in question mode
 * and flips to answer mode when correct answer is selected
 */
const WordCardComponent: React.FC<WordCardProps> = ({ 
  wordData,
  style,
  onViewDetails
}) => {
  // Get safe area insets to adjust for notches and home indicators
  const insets = useSafeAreaInsets();
  
  // Use Zustand cardStore for flip state
  const isFlipped = useCardStore(state => state.isCardFlipped(wordData.id));
  const flipCard = useCardStore(state => state.flipCard);
  
  // Animation shared value for flip (0 = question, 1 = answer)
  const flipProgress = useSharedValue(isFlipped ? 1 : 0);
  
  // Update animation when isFlipped changes
  useEffect(() => {
    flipProgress.value = withTiming(isFlipped ? 1 : 0, { duration: 500 });
  }, [isFlipped, flipProgress]);
  
  // Handle flip back to question side
  const handleFlipBack = useCallback(() => {
    flipCard(wordData.id, false);
  }, [wordData.id, flipCard]);
  
  // Front card animated styles (question side)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipProgress.value, [0, 1], [0, 180]);
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` }
      ],
      opacity: flipProgress.value > 0.5 ? 0 : 1, // Hide when past halfway point
    };
  });

  // Back card animated styles (answer side)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipProgress.value, [0, 1], [180, 360]);
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` }
      ],
      opacity: flipProgress.value > 0.5 ? 1 : 0, // Show when past halfway point
    };
  });
  
  return (
    <View style={[styles.outerContainer, style]}>
      <View style={styles.container}>
        <Animated.View style={[styles.cardContainer, frontAnimatedStyle]}>
          <WordCardQuestion
            wordData={wordData}
            style={styles.cardContent}
          />
        </Animated.View>
        
        <Animated.View style={[styles.cardContainer, backAnimatedStyle]}>
          <WordCardAnswer
            wordData={wordData}
            style={styles.cardContent}
            onViewDetails={onViewDetails}
            onFlipBack={handleFlipBack}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0, // Removed margin completely
    overflow: 'visible', // Ensure animations aren't clipped
  },
  container: {
    width: CARD_WIDTH,
    flex: 1, // Use flex to fill available space
    position: 'relative',
    marginVertical: 0, // Removed margin completely
  },
  cardContainer: {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardContent: {
    width: '100%',
    height: '100%',
  }
});

// Apply memo to the component
const WordCard = memo(WordCardComponent);

// Set display name for better debugging
WordCard.displayName = 'WordCard';

export default WordCard; 