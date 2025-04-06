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
  runOnJS,
} from 'react-native-reanimated';
import { useWordCardStore, CardFace } from '../../store/wordCardStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import spacing from '../../theme/spacing';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

// Get screen dimensions to calculate responsive card size
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - (spacing.screenPadding * 2), 400); // Max width of 400, respecting screen padding
// Define card height for consistent sizing
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.7, 700); // 70% of screen height, max 700px

// Animation Constants
const ANIMATION_DURATION = 500;
const PERSPECTIVE = 1000;

// Map from CardFace string to numeric animation values
const CARD_FACE_TO_VALUE: Record<CardFace, number> = {
  'question': 0,
  'answer': 1,
  'reflection': 2
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
  const isFocused = useIsFocused();
  
  // Store state handlers
  const getCardFace = useWordCardStore(state => state.getCardFace);
  const setCardFace = useWordCardStore(state => state.setCardFace);
  const isRevealed = useWordCardStore(state => state.isWordRevealed(wordData.id));
  const getAttempts = useWordCardStore(state => state.getAttempts);
  
  // Track the current face in component state for better synchronization
  const [currentFace, setCurrentFace] = useState<CardFace>(() => {
    // Initialize based on store, ensuring it's consistent with revealed state
    const face = getCardFace(wordData.id);
    console.log(`[WordCard ${wordData.id}] Initial face from store: ${face}, isRevealed: ${isRevealed}`);
    
    // Force answer face if revealed (defensive)
    if (isRevealed && face === 'question') {
      console.log(`[WordCard ${wordData.id}] Correcting initial face from question to answer (revealed word)`);
      setCardFace(wordData.id, 'answer');
      return 'answer';
    }
    return face;
  });
  
  // Create flipProgress animation value - always initialize to exact current face value
  const flipProgress = useSharedValue(CARD_FACE_TO_VALUE[currentFace]);
  
  // Define animation configuration
  const animationConfig = {
    duration: ANIMATION_DURATION,
    easing: Easing.inOut(Easing.cubic),
  };
  
  // Function to immediately set the card face without animation
  const setFaceImmediately = useCallback((face: CardFace) => {
    console.log(`[WordCard ${wordData.id}] Setting face immediately to: ${face}`);
    
    // Update the store
    setCardFace(wordData.id, face);
    
    // Update local state
    setCurrentFace(face);
    
    // Set animation value directly without animation
    flipProgress.value = CARD_FACE_TO_VALUE[face];
  }, [wordData.id, setCardFace, flipProgress]);
  
  // Function to animate to a new face
  const animateToFace = useCallback((face: CardFace) => {
    // Skip if already at the target face
    if (currentFace === face) return;
    
    console.log(`[WordCard ${wordData.id}] Animating from ${currentFace} to ${face}`);
    
    // Update the store right away
    setCardFace(wordData.id, face);
    
    // Update component state
    setCurrentFace(face);
    
    // Animate to the new value
    const targetValue = CARD_FACE_TO_VALUE[face];
    flipProgress.value = withTiming(targetValue, animationConfig);
  }, [wordData.id, currentFace, setCardFace, flipProgress, animationConfig]);
  
  // When screen regains focus, force-sync with the store
  useFocusEffect(
    useCallback(() => {
      console.log(`[WordCard ${wordData.id}] Screen focus effect, isRevealed: ${isRevealed}`);
      
      // Get the latest state from the store when focused
      const storeCardFace = getCardFace(wordData.id);
      
      // If there's a mismatch between component state and store, sync immediately
      if (storeCardFace !== currentFace) {
        console.log(`[WordCard ${wordData.id}] Focus detected state mismatch: component=${currentFace}, store=${storeCardFace}`);
        setFaceImmediately(storeCardFace);
      }
      
      // Double-check revealed words always show the right face
      if (isRevealed && storeCardFace === 'question') {
        console.log(`[WordCard ${wordData.id}] Focus correcting revealed word from question to answer`);
        setFaceImmediately('answer');
      }
      
      return () => {
        console.log(`[WordCard ${wordData.id}] Screen lost focus`);
      };
    }, [wordData.id, getCardFace, currentFace, isRevealed, setFaceImmediately])
  );
  
  // Callback to navigate to reflection face
  const navigateToReflection = useCallback(() => {
    console.log(`[WordCard ${wordData.id}] Navigating to reflection`);
    animateToFace('reflection');
  }, [wordData.id, animateToFace]);
  
  // Callback to flip back to answer from reflection
  const flipBackToAnswer = useCallback(() => {
    console.log(`[WordCard ${wordData.id}] Flipping back to answer from reflection`);
    animateToFace('answer');
  }, [wordData.id, animateToFace]);
  
  // Log mount/unmount for debugging
  useEffect(() => {
    console.log(`[WordCard ${wordData.id}] Mounted with face: ${currentFace}, isRevealed: ${isRevealed}`);
    
    // Safety check - make sure revealed words never show question face
    if (isRevealed && currentFace === 'question') {
      console.log(`[WordCard ${wordData.id}] Mount correcting revealed word from question to answer`);
      setFaceImmediately('answer');
    }
    
    return () => {
      console.log(`[WordCard ${wordData.id}] Unmounted`);
    };
  }, [wordData.id, currentFace, isRevealed, setFaceImmediately]);

  // Animated styles for Question Card (Face 0)
  const questionAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180], Extrapolate.CLAMP);
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
    const rotateY = interpolate(flipProgress.value, [0, 1, 2], [180, 360, 540], Extrapolate.CLAMP); 
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
    const rotateY = interpolate(flipProgress.value, [0, 1, 2], [360, 540, 720], Extrapolate.CLAMP); 
    const opacity = interpolate(flipProgress.value, [1.5, 2], [0, 1], Extrapolate.CLAMP); 
    return {
      transform: [{ perspective: PERSPECTIVE }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: flipProgress.value > 1.5 ? 1 : 0, 
      pointerEvents: flipProgress.value > 1.5 ? 'auto' : 'none', 
    };
  });
  
  // If not focused, prevent rendering the complex animation structure
  if (!isFocused) {
    return <View style={[styles.container, style]} />;
  }
  
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

// Wrap with memo to prevent unnecessary re-renders
const WordCard = memo(WordCardComponent);

export default WordCard; 