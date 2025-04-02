import React, { memo, useCallback, useEffect, useState } from 'react';
import { StyleProp, ViewStyle, View, Dimensions, Platform, StyleSheet } from 'react-native';
import { WordOfDay } from '../../types/wordOfDay';
import WordCardQuestion from './WordCardQuestion';
import WordCardAnswer from './WordCardAnswer';
import ReflectionCard from './ReflectionCard';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import { useCardStore } from '../../store/cardStore';
import { useWordStore } from '../../store/wordStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import spacing from '../../theme/spacing';

// Get screen dimensions to calculate responsive card size
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - (spacing.screenPadding * 2), 400); // Max width of 400, respecting screen padding
// Define card height for consistent sizing
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.7, 700); // 70% of screen height, max 700px

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

type CardFace = 'question' | 'answer' | 'reflection';

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
  
  // Access word store to get the word's revealed state
  const storedWords = useWordStore(state => state.words);
  
  // State to manage the target face
  const [targetFace, setTargetFace] = useState<CardFace>(() => 
    storedWords.some(w => 
      w.id === wordData.id && w.isRevealed
    ) ? 'answer' : 'question' // Initial state based on reveal
  );
  
  // Shared value for animation progress (0=question, 1=answer, 2=reflection)
  const flipProgress = useSharedValue(targetFace === 'answer' ? 1 : targetFace === 'reflection' ? 2 : 0);
  
  // Animation Configuration
  const animationConfig = {
    duration: 500,
    easing: Easing.inOut(Easing.cubic), // Smoother easing
  };

  // Animate flipProgress when targetFace changes
  useEffect(() => {
    let targetValue = 0;
    if (targetFace === 'answer') targetValue = 1;
    else if (targetFace === 'reflection') targetValue = 2;
    
    flipProgress.value = withTiming(targetValue, animationConfig);
    
    // Update the store's isFlipped state based on targetFace
    // (Question = not flipped, Answer/Reflection = flipped)
    // This assumes the store's `isFlipped` primarily controls the back/front visibility
    // for things like the parent component determining initial state.
    const shouldBeFlipped = targetFace === 'answer' || targetFace === 'reflection';
    if (isFlipped !== shouldBeFlipped) {
      flipCard(wordData.id, shouldBeFlipped);
    }

  }, [targetFace, flipProgress, flipCard, wordData.id, isFlipped]);

  // Effect to sync targetFace if isWordRevealed changes externally (e.g., reset)
  useEffect(() => {
    if (!storedWords.some(w => 
      w.id === wordData.id && w.isRevealed
    ) && targetFace !== 'question') {
      setTargetFace('question');
    }
    // If it becomes revealed but we are on question, go to answer
    if (storedWords.some(w => 
      w.id === wordData.id && w.isRevealed
    ) && targetFace === 'question') {
       setTargetFace('answer');
    }
  }, [storedWords, wordData.id, targetFace]);

  // Handlers to change the target face
  const handleFlipToAnswer = useCallback(() => {
    setTargetFace('answer');
  }, []);

  const handleFlipToReflection = useCallback(() => {
    setTargetFace('reflection');
  }, []);

  const handleFlipToQuestion = useCallback(() => {
    // Only flip back if NOT revealed? Or always allow?
    // For now, let's always allow 3-way flip as discussed
    setTargetFace('question');
  }, []);

  // Animated styles for Question Card (Face 0)
  const questionAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180], Extrapolate.CLAMP);
    const opacity = interpolate(flipProgress.value, [0, 0.5], [1, 0], Extrapolate.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: flipProgress.value <= 0.5 ? 3 : 0,
      pointerEvents: flipProgress.value <= 0.5 ? 'auto' : 'none', 
    };
  });

  // Animated styles for Answer Card (Face 1)
  const answerAnimatedStyle = useAnimatedStyle(() => {
    // Continuous rotation: 180 -> 360 -> 540
    const rotateY = interpolate(flipProgress.value, [0, 1, 2], [180, 360, 540], Extrapolate.CLAMP); 
    // Visible between 0.5 and 1.5
    const opacity = interpolate(flipProgress.value, [0.5, 1, 1.5, 2], [0, 1, 1, 0], Extrapolate.CLAMP); 
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      // zIndex based on progress range
      zIndex: flipProgress.value > 0.5 && flipProgress.value <= 1.5 ? 2 : 0, 
      // pointerEvents based on progress range
      pointerEvents: flipProgress.value > 0.5 && flipProgress.value <= 1.5 ? 'auto' : 'none', 
    };
  });

  // Animated styles for Reflection Card (Face 2)
  const reflectionAnimatedStyle = useAnimatedStyle(() => {
    // Continuous rotation: 360 -> 540 -> 720
    const rotateY = interpolate(flipProgress.value, [0, 1, 2], [360, 540, 720], Extrapolate.CLAMP); 
    // Visible between 1.5 and 2 (or maybe 2.5 if we extend range? Let's stick to 2)
    const opacity = interpolate(flipProgress.value, [1.5, 2], [0, 1], Extrapolate.CLAMP); 
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      // zIndex based on progress range
      zIndex: flipProgress.value > 1.5 ? 1 : 0, 
      // pointerEvents based on progress range
      pointerEvents: flipProgress.value > 1.5 ? 'auto' : 'none', 
    };
  });
  
  return (
    <View style={[styles.outerContainer, style]}>
      <View style={styles.container}>
        {/* Question Card */}
        <Animated.View 
          style={[styles.cardContainer, questionAnimatedStyle]} 
        >
          <WordCardQuestion
            wordData={wordData}
            style={styles.cardContent}
            onCorrectAnswer={handleFlipToAnswer}
          />
        </Animated.View>
        
        {/* Answer Card */}
        <Animated.View 
          style={[styles.cardContainer, answerAnimatedStyle]} 
        >
          <WordCardAnswer
            wordData={wordData}
            style={styles.cardContent}
            onViewDetails={onViewDetails}
            onNavigateToReflection={handleFlipToReflection} 
          />
        </Animated.View>

        {/* Reflection Card */}
        <Animated.View 
          style={[styles.cardContainer, reflectionAnimatedStyle]}
        >
          <ReflectionCard 
            wordData={wordData}
            style={styles.cardContent}
            onFlipBack={handleFlipToQuestion}
            onNavigateToAnswer={handleFlipToAnswer}
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