import React, { memo, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { StyleProp, ViewStyle, View, Dimensions, Platform, StyleSheet, TouchableOpacity } from 'react-native';
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
  // Log received wordData immediately
  console.log(`[WordCard ${wordData?.id ?? 'ID_MISSING'}] Rendering. Received wordData:`, wordData);

  const insets = useSafeAreaInsets();
  
  // --- Read state directly from stores ---
  const isFlipped = useCardStore(state => state.isCardFlipped(wordData.id));
  const selectedOptionValue = useCardStore(state => state.getSelectedOption(wordData.id));
  const getAttempts = useCardStore(state => state.getAttempts); // Still needed for markWordRevealed
  
  // Get word from store with a more specific selector
  const isRevealed = useWordStore(state => {
    const word = state.words.find(w => w.id === wordData.id);
    return word?.isRevealed ?? false;
  });
  // Get full word for debugging
  const wordFromStore = useWordStore(state => state.words.find(w => w.id === wordData.id));
  const markWordRevealed = useWordStore(state => state.markWordRevealed);
  const clearSelection = useCardStore(state => state.clearSelection); // Get clear action
  
  // --- FALLBACK REVEALED CHECK: Check CardStore as a backup to determine if word has been answered ---
  // This helps when the WordStore's isRevealed state hasn't fully rehydrated after tab switches
  const isProbablyRevealed = useMemo(() => {
    // Check if there's a selected option in the card store AND it's correct
    const hasCorrectSelection = (selectedOptionValue !== undefined) && 
      wordData.options?.find(o => o.value === selectedOptionValue)?.isCorrect === true;
    
    // Check if the card is flipped in the card store
    const isCardFlipped = isFlipped === true;
    
    // If either condition is true, we should consider this word revealed
    return isRevealed || hasCorrectSelection || isCardFlipped;
  }, [isRevealed, selectedOptionValue, wordData.options, isFlipped]);
  
  // Debug revealed state to track the issue
  useEffect(() => {
    console.log(`[WordCard ${wordData.id}] Revealed state check: isRevealed=${isRevealed}, wordFromStore.isRevealed=${wordFromStore?.isRevealed}, isProbablyRevealed=${isProbablyRevealed}`);
  }, [wordData.id, isRevealed, wordFromStore, isProbablyRevealed]);

  // --- Determine correctness (moved calculation here) ---
  const isSelectionCorrect = useMemo(() => {
      if (!selectedOptionValue) return false;
      // Use wordData from props as it's the source of truth for options
      return wordData.options?.find(o => o.value === selectedOptionValue)?.isCorrect ?? false;
  }, [selectedOptionValue, wordData.options]);

  // Initialize flipProgress directly based on initial store state read above
  const calculateInitialTargetValue = () => {
      // Force immediate check of word store state to avoid stale data
      const storeState = useWordStore.getState();
      const freshWordFromStore = storeState.words.find(w => w.id === wordData.id);
      const freshSelectedOption = useCardStore.getState().getSelectedOption(wordData.id);
      const freshIsCorrect = wordData.options?.find(o => o.value === freshSelectedOption)?.isCorrect === true;
      const freshIsFlipped = useCardStore.getState().isCardFlipped(wordData.id);
      
      // Multiple ways to determine if a word is revealed:
      // 1. Direct isRevealed flag in word store
      // 2. Having a correct answer selected
      // 3. Card being in flipped state in card store
      const currentIsRevealed = 
        freshWordFromStore?.isRevealed || // Primary check from word store
        isRevealed || // Selector from component
        freshIsCorrect || // Has correct answer
        freshIsFlipped; // Card is flipped in store
      
      console.log(`[WordCard ${wordData.id}] Calculating initialTargetValue: selectedOption=${freshSelectedOption}, isCorrect=${freshIsCorrect}, isRevealed=${isRevealed}, isFlipped=${freshIsFlipped}, FINAL=${!!currentIsRevealed}`);
      
      // Force immediate position without animation for initial state
      // Always go to answer if the word is revealed by ANY means
      if (currentIsRevealed) {
          return FACE_VALUES.answer;
      } else {
          // Show question face only if definitely not revealed
          return FACE_VALUES.question;
      }
  };
  
  // Create a ref to track if the component was just mounted to prevent unnecessary animations
  const justMounted = useRef(true);
  const prevWordId = useRef(wordData.id);
  const flipProgress = useSharedValue(calculateInitialTargetValue());
  
  // Reset flip progress if word ID changes
  useEffect(() => {
    if (prevWordId.current !== wordData.id) {
      console.log(`[WordCard] Word ID changed from ${prevWordId.current} to ${wordData.id} - resetting flip progress`);
      flipProgress.value = calculateInitialTargetValue();
      prevWordId.current = wordData.id;
      justMounted.current = true; // Treat as a fresh mount when word changes
    }
  }, [wordData.id]);
  
  const animationConfig = {
    duration: ANIMATION_DURATION,
    easing: Easing.inOut(Easing.cubic),
  };

  // --- Effect to drive animation based on subsequent store state changes ---
  useEffect(() => {
    // Calculate the target value based on CURRENT store state
    let targetValue = FACE_VALUES.question; 
    const currentSelectedOption = useCardStore.getState().getSelectedOption(wordData.id);
    const currentIsCorrect = wordData.options?.find(o => o.value === currentSelectedOption)?.isCorrect ?? false;
    
    // Multiple ways to check if a word is revealed
    const storeState = useWordStore.getState();
    const freshWordFromStore = storeState.words.find(w => w.id === wordData.id);
    const freshIsFlipped = useCardStore.getState().isCardFlipped(wordData.id);
    const currentIsRevealed = 
      freshWordFromStore?.isRevealed || // Word store
      isRevealed || // Component state
      currentIsCorrect || // Has correct answer
      freshIsFlipped; // Card is flipped

    // Important: For revealed words, never go back to question face
    if (currentIsRevealed) {
        // Ensure revealed words always show answer card when not in reflection
        targetValue = flipProgress.value === FACE_VALUES.reflection ? 
          FACE_VALUES.reflection : FACE_VALUES.answer;
    }
    
    // Extra logging to debug the issue
    console.log(`[WordCard ${wordData.id}] Animation update: targetValue=${targetValue}, isRevealed=${currentIsRevealed}, currentProgress=${flipProgress.value}`);
    
    // Only animate if:
    // 1. Not the initial render
    // 2. The target value is different from current value
    if (!justMounted.current && flipProgress.value !== targetValue) {
        console.log(`[WordCard ${wordData.id}] Store state changed. Animating flipProgress from ${flipProgress.value} to ${targetValue}`);
        flipProgress.value = withTiming(targetValue, animationConfig);
    } else if (justMounted.current) {
        console.log(`[WordCard ${wordData.id}] Initial render - skipping animation, setting direct value: ${targetValue}`);
        // For initial render, set the value directly without animation
        // This ensures the card is in the correct state immediately
        flipProgress.value = targetValue;
    }
    
    // Mark initial mount as complete after the first check
    justMounted.current = false;
    
  // Depend on the state values that determine the target face
  }, [selectedOptionValue, isSelectionCorrect, isRevealed, isProbablyRevealed, wordData.id, animationConfig, flipProgress]); // Added isProbablyRevealed

  // --- Callbacks for Child Components ---
  // Remove callbacks related to showReflection
  // const handleFlipBackFromReflection = useCallback(() => { ... }); 

  // Log mount/unmount
  useEffect(() => {
    console.log(`[WordCard ${wordData.id}] Mounted`);
    return () => {
      console.log(`[WordCard ${wordData.id}] Unmounted`);
    };
  }, [wordData.id]);

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
    const opacity = interpolate(flipProgress.value, [0.5, 1, 1.5], [0, 1, 0], Extrapolate.CLAMP); 
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
  
  // Add function to navigate to reflection
  const navigateToReflection = useCallback(() => {
    console.log(`[WordCard ${wordData.id}] Navigating to reflection`);
    // Update flip progress to reflection
    flipProgress.value = withTiming(FACE_VALUES.reflection, animationConfig);
  }, [wordData.id, flipProgress, animationConfig]);
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.innerContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 0 }]}>
        {/* Question Card */}
        <Animated.View style={[styles.cardContainer, questionAnimatedStyle]}>
          <WordCardQuestion
            wordData={wordData}
            style={styles.cardContent}
            markWordRevealed={markWordRevealed}
            getWordAttempts={() => getAttempts(wordData.id) ?? 0}
          />
        </Animated.View>
        
        {/* Answer Card - Restore tappable wrapper */}
        <Animated.View style={[styles.cardContainer, answerAnimatedStyle]}>
          <TouchableOpacity 
            style={styles.touchableFace}
            activeOpacity={0.9}
            onPress={navigateToReflection}>
            <WordCardAnswer
              wordData={wordData}
              style={styles.cardContent}
              onViewDetails={onViewDetails}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Reflection Card */}
        <Animated.View style={[styles.cardContainer, reflectionAnimatedStyle]}>
          <ReflectionCard 
            wordData={wordData}
            style={styles.cardContent}
            // Change to flip back to answer instead of question
            onFlipBack={() => {
              console.log(`[WordCard ${wordData.id}] Flipping back to answer from reflection`);
              flipProgress.value = withTiming(FACE_VALUES.answer, animationConfig);
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0, // Removed margin completely
    overflow: 'visible', // Ensure animations aren't clipped
  },
  innerContainer: {
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
  },
  touchableFace: { // Add style for touchable wrapper
    width: '100%',
    height: '100%',
  },
});

// Apply memo to the component
const WordCard = memo(WordCardComponent);

// Set display name for better debugging
WordCard.displayName = 'WordCard';

export default WordCard; 