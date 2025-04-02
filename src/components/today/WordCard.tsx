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

// Animation Constants
const ANIMATION_DURATION = 500;
const PERSPECTIVE = 1000;
const FACE_VALUES = {
  question: 0,
  answer: 1,
  reflection: 2,
};

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
  
  const isWordRevealed = storedWords.some(w => 
    w.id === wordData.id && w.isRevealed
  );
  
  const [targetFace, setTargetFace] = useState<CardFace>(() => 
    isWordRevealed ? 'answer' : 'question'
  );
  
  const flipProgress = useSharedValue(
    targetFace === 'answer' ? FACE_VALUES.answer : 
    targetFace === 'reflection' ? FACE_VALUES.reflection : 
    FACE_VALUES.question
  );
  
  const animationConfig = {
    duration: ANIMATION_DURATION,
    easing: Easing.inOut(Easing.cubic),
  };

  // Animate flipProgress when targetFace changes
  useEffect(() => {
    let targetValue = FACE_VALUES[targetFace];
    flipProgress.value = withTiming(targetValue, animationConfig);
    
    // Update the store's isFlipped state based on targetFace
    // Syncing local `targetFace` with global `isFlipped` ensures that 
    // external logic relying on `isFlipped` (like persistence or initial 
    // state calculation based on reveal status) remains consistent with 
    // the card's visual state.
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
  const setTargetFaceToAnswer = useCallback(() => { setTargetFace('answer'); }, []);
  const setTargetFaceToReflection = useCallback(() => { setTargetFace('reflection'); }, []);
  const setTargetFaceToQuestion = useCallback(() => { setTargetFace('question'); }, []);

  // Animated styles for Question Card (Face 0)
  const questionAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [FACE_VALUES.question, FACE_VALUES.answer], [0, 180], Extrapolate.CLAMP);
    const opacity = interpolate(flipProgress.value, [0, 0.5], [1, 0], Extrapolate.CLAMP);
    return {
      transform: [{ perspective: PERSPECTIVE }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: flipProgress.value <= 0.5 ? 3 : 0,
      pointerEvents: flipProgress.value <= 0.5 ? 'auto' : 'none', 
    };
  });

  // Animated styles for Answer Card (Face 1)
  const answerAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [FACE_VALUES.question, FACE_VALUES.answer, FACE_VALUES.reflection], [180, 360, 540], Extrapolate.CLAMP); 
    const opacity = interpolate(flipProgress.value, [0.5, 1, 1.5, 2], [0, 1, 1, 0], Extrapolate.CLAMP); 
    return {
      transform: [{ perspective: PERSPECTIVE }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: flipProgress.value > 0.5 && flipProgress.value <= 1.5 ? 2 : 0, 
      pointerEvents: flipProgress.value > 0.5 && flipProgress.value <= 1.5 ? 'auto' : 'none', 
    };
  });

  // Animated styles for Reflection Card (Face 2)
  const reflectionAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [FACE_VALUES.question, FACE_VALUES.answer, FACE_VALUES.reflection], [360, 540, 720], Extrapolate.CLAMP); 
    const opacity = interpolate(flipProgress.value, [1.5, 2], [0, 1], Extrapolate.CLAMP); 
    return {
      transform: [{ perspective: PERSPECTIVE }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: flipProgress.value > 1.5 ? 1 : 0, 
      pointerEvents: flipProgress.value > 1.5 ? 'auto' : 'none', 
    };
  });
  
  return (
    <View style={[styles.outerContainer, style]}>
      <View style={styles.container}>
        {/* Question Card */}
        <Animated.View style={[styles.cardContainer, questionAnimatedStyle]}>
          <WordCardQuestion
            wordData={wordData}
            style={styles.cardContent}
            onCorrectAnswer={setTargetFaceToAnswer}
          />
        </Animated.View>
        
        {/* Answer Card */}
        <Animated.View style={[styles.cardContainer, answerAnimatedStyle]}>
          <WordCardAnswer
            wordData={wordData}
            style={styles.cardContent}
            onViewDetails={onViewDetails}
            onNavigateToReflection={setTargetFaceToReflection}
          />
        </Animated.View>

        {/* Reflection Card */}
        <Animated.View style={[styles.cardContainer, reflectionAnimatedStyle]}>
          <ReflectionCard 
            wordData={wordData}
            style={styles.cardContent}
            onFlipBack={setTargetFaceToQuestion}
            onNavigateToAnswer={setTargetFaceToAnswer}
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