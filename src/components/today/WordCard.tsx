import React, { memo, useState, useCallback, useEffect } from 'react';
import { StyleProp, ViewStyle, View } from 'react-native';
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
  
  /**
   * Function called when the word is revealed (answer is shown)
   */
  onReveal?: (wordId: string, attempts: number) => void;
}

/**
 * Card component that displays a word of the day in question mode
 * and flips to answer mode when correct answer is selected
 */
const WordCardComponent: React.FC<WordCardProps> = ({ 
  wordData: initialWordData,
  style,
  onViewDetails,
  onReveal
}) => {
  // Local state to track word data including user interactions
  const [wordData, setWordData] = useState<WordOfDay>(initialWordData);
  
  // Animation shared value for flip (0 = question, 1 = answer)
  const isFlipped = useSharedValue(0);
  
  // When the component updates with new props
  useEffect(() => {
    // Update local state if the prop changes
    if (initialWordData.id !== wordData.id) {
      setWordData(initialWordData);
      isFlipped.value = 0; // Reset flip animation
    }
  }, [initialWordData, wordData.id, isFlipped]);
  
  // Handle option selection in question mode
  const handleOptionSelect = useCallback((option: string, isCorrect: boolean) => {
    // Calculate attempts (increment if incorrect)
    const attempts = wordData.userAttempts ? wordData.userAttempts + (isCorrect ? 0 : 1) : 1;
    
    // Update word data
    const updatedWordData = {
      ...wordData,
      selectedOption: option,
      userAttempts: attempts,
    };
    
    setWordData(updatedWordData);
    
    // If correct, animate the flip to show answer
    if (isCorrect) {
      // Animate flip with Reanimated
      isFlipped.value = withTiming(1, { duration: 800 });
      
      // Still notify parent for tracking purposes
      if (onReveal) {
        onReveal(wordData.id, attempts);
      }
    }
  }, [wordData, onReveal, isFlipped]);
  
  // Front card animated styles (question side)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(isFlipped.value, [0, 1], [0, 180]);
    
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      opacity: isFlipped.value > 0.5 ? 0 : 1, // Hide when past halfway point
    };
  });

  // Back card animated styles (answer side)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(isFlipped.value, [0, 1], [180, 360]);
    
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      opacity: isFlipped.value > 0.5 ? 1 : 0, // Show when past halfway point
    };
  });
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.cardContainer, frontAnimatedStyle]}>
        <WordCardQuestion
          wordData={wordData}
          style={style}
          onOptionSelect={handleOptionSelect}
        />
      </Animated.View>
      
      <Animated.View style={[styles.cardContainer, backAnimatedStyle]}>
        <WordCardAnswer
          wordData={wordData}
          style={style}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  cardContainer: {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }
});

// Apply memo to the component
const WordCard = memo(WordCardComponent);

// Set display name for better debugging
WordCard.displayName = 'WordCard';

export default WordCard; 