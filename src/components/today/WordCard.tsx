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
import { useWordCardStore, CardFace } from '../../store/wordCardStore';
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

// Map from CardFace string to numeric animation values
const CARD_FACE_TO_VALUE: Record<CardFace, number> = {
  'question': FACE_VALUES.question,
  'answer': FACE_VALUES.answer,
  'reflection': FACE_VALUES.reflection
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

/**
 * Card component that displays a word of the day with flip animation between different faces:
 * question (front), answer (back), and reflection
 */
const WordCardComponent: React.FC<WordCardProps> = ({ 
  wordData,
  style,
  onViewDetails
}) => {
  // Log rendering for debugging
  console.log(`[WordCard ${wordData?.id ?? 'ID_MISSING'}] Rendering with word:`, wordData.word);

  const insets = useSafeAreaInsets();
  
  // --- Use the unified store for all state ---
  const cardFace = useWordCardStore(state => state.getCardFace(wordData.id));
  const selectedOption = useWordCardStore(state => state.getSelectedOption(wordData.id));
  const isRevealed = useWordCardStore(state => state.isWordRevealed(wordData.id));
  const getAttempts = useWordCardStore(state => state.getAttempts);
  const setCardFace = useWordCardStore(state => state.setCardFace);
  
  // Create refs to track component lifecycle
  const isInitialMount = useRef(true);
  const prevWordId = useRef(wordData.id);
  
  // Initialize flipProgress animation value based on current card face
  const flipProgress = useSharedValue(CARD_FACE_TO_VALUE[cardFace] || 0);
  
  // Define animation configuration
  const animationConfig = {
    duration: ANIMATION_DURATION,
    easing: Easing.inOut(Easing.cubic),
  };
  
  // Reset animation state when word changes
  useEffect(() => {
    if (prevWordId.current !== wordData.id) {
      console.log(`[WordCard] Word ID changed from ${prevWordId.current} to ${wordData.id}`);
      
      // Update the flip progress immediately based on current face
      const targetValue = CARD_FACE_TO_VALUE[cardFace] || 0;
      flipProgress.value = targetValue;
      
      // Update refs
      prevWordId.current = wordData.id;
      isInitialMount.current = true;
    }
  }, [wordData.id, cardFace, flipProgress]);
  
  // Update animation when card face changes
  useEffect(() => {
    const targetValue = CARD_FACE_TO_VALUE[cardFace];
    
    console.log(`[WordCard ${wordData.id}] Card face changed to: ${cardFace}, targeting animation value: ${targetValue}`);
    
    // On initial mount, set value directly without animation
    if (isInitialMount.current) {
      console.log(`[WordCard ${wordData.id}] Initial render - setting direct value: ${targetValue}`);
      flipProgress.value = targetValue;
      isInitialMount.current = false;
    } 
    // Otherwise, animate to the new value
    else if (flipProgress.value !== targetValue) {
      console.log(`[WordCard ${wordData.id}] Animating from ${flipProgress.value} to ${targetValue}`);
      flipProgress.value = withTiming(targetValue, animationConfig);
    }
  }, [cardFace, wordData.id, flipProgress, animationConfig]);
  
  // Callback to navigate to reflection face
  const navigateToReflection = useCallback(() => {
    console.log(`[WordCard ${wordData.id}] Navigating to reflection`);
    setCardFace(wordData.id, 'reflection');
  }, [wordData.id, setCardFace]);
  
  // Callback to flip back to answer from reflection
  const flipBackToAnswer = useCallback(() => {
    console.log(`[WordCard ${wordData.id}] Flipping back to answer from reflection`);
    setCardFace(wordData.id, 'answer');
  }, [wordData.id, setCardFace]);
  
  // Log mount/unmount for debugging
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
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.innerContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 0 }]}>
        {/* Question Card */}
        <Animated.View style={[styles.cardContainer, questionAnimatedStyle]}>
          <WordCardQuestion
            wordData={wordData}
            style={styles.cardContent}
            getWordAttempts={() => getAttempts(wordData.id)}
          />
        </Animated.View>
        
        {/* Answer Card */}
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
            onFlipBack={flipBackToAnswer}
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
    marginVertical: 0,
    overflow: 'visible',
  },
  innerContainer: {
    width: CARD_WIDTH,
    flex: 1,
    position: 'relative',
    marginVertical: 0,
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
  touchableFace: {
    width: '100%',
    height: '100%',
  },
});

// Apply memo to the component
const WordCard = memo(WordCardComponent);

// Set display name for better debugging
WordCard.displayName = 'WordCard';

export default WordCard; 