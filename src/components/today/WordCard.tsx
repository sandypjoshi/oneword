import React, {
  memo,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import {
  StyleProp,
  ViewStyle,
  View,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
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
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../theme';

// Get screen dimensions to calculate responsive card size
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - spacing.screenPadding * 2, 400); // Max width of 400, respecting screen padding
// Define card height for consistent sizing
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.7, 700); // 70% of screen height, max 700px

// Animation Constants
const ANIMATION_DURATION = 500;
const PERSPECTIVE = 1000;

// Map from CardFace string to numeric animation values
const CARD_FACE_TO_VALUE: Record<CardFace, number> = {
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

/**
 * Card component that displays a word of the day with flip animation between different faces:
 * question (front), answer (back), and reflection
 */
const WordCardComponent: React.FC<WordCardProps> = ({
  wordData,
  style,
  onViewDetails,
}) => {
  // Log rendering for debugging
  console.log(
    `[WordCard ${wordData?.id ?? 'ID_MISSING'}] Rendering with word:`,
    wordData.word
  );

  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // Store state handlers
  const currentFace = useWordCardStore(state => state.getCardFace(wordData.id));
  const setCardFace = useWordCardStore(state => state.setCardFace);
  const getAttempts = useWordCardStore(state => state.getAttempts);

  // Animation state
  const flipProgress = useSharedValue(CARD_FACE_TO_VALUE[currentFace]);

  // Define animation configuration
  const animationConfig = {
    duration: ANIMATION_DURATION,
    easing: Easing.inOut(Easing.cubic),
  };

  // Use useEffect to synchronize the animation value when the store state changes
  useEffect(() => {
    console.log(
      `[WordCard ${wordData.id}] useEffect watching currentFace: ${currentFace}`
    );
    const targetValue = CARD_FACE_TO_VALUE[currentFace];
    const currentValue = flipProgress.value;

    // Only animate if the target value is different from the current animation value
    if (currentValue !== targetValue) {
      console.log(
        `[WordCard ${wordData.id}] Animating flipProgress from ${currentValue} -> ${targetValue}`
      );
      flipProgress.value = withTiming(targetValue, animationConfig);
    } else {
      console.log(
        `[WordCard ${wordData.id}] flipProgress (${currentValue}) already matches target (${targetValue}). No animation needed.`
      );
      // Optional: Ensure the value is exact if timings caused slight drift, though usually not necessary
      // flipProgress.value = targetValue;
    }
    // It's crucial that currentFace (derived from the store selector) is the dependency
  }, [currentFace, flipProgress, animationConfig, wordData.id]);

  // Function to trigger a state change to a specific face
  const triggerFaceChange = useCallback(
    (face: CardFace) => {
      // Get the *latest* state directly from the store *inside* the callback
      // to prevent using stale 'currentFace' from closure scope for the check.
      const storeFace = useWordCardStore.getState().getCardFace(wordData.id);

      if (storeFace === face) {
        console.log(
          `[WordCard ${wordData.id}] triggerFaceChange called for ${face}, but store already matches. Skipping setCardFace.`
        );
        return; // Avoid unnecessary store updates if already in the target state
      }
      console.log(
        `[WordCard ${wordData.id}] triggerFaceChange called. Setting store face to: ${face}`
      );
      setCardFace(wordData.id, face);
      // The useEffect listening to the store selector 'currentFace' handles the animation trigger.
    },
    [wordData.id, setCardFace]
  ); // Dependencies are stable functions/values needed to *call* setCardFace

  // Callback to navigate to reflection face
  const navigateToReflection = useCallback(() => {
    console.log(`[WordCard ${wordData.id}] Navigating to reflection`);
    triggerFaceChange('reflection');
  }, [triggerFaceChange, wordData.id]);

  // Callback to flip back to answer from reflection
  const flipBackToAnswer = useCallback(() => {
    console.log(
      `[WordCard ${wordData.id}] Flipping back to answer from reflection`
    );
    triggerFaceChange('answer');
  }, [triggerFaceChange, wordData.id]);

  // Log mount/unmount for debugging
  useEffect(() => {
    console.log(
      `[WordCard ${wordData.id}] Mounted. Initial store face: ${currentFace}`
    );
    // Removed the corrective logic here as store should be source of truth
    // and useEffect handles animation sync.
    return () => {
      console.log(`[WordCard ${wordData.id}] Unmounted`);
    };
  }, [wordData.id]); // Run only on mount/unmount

  // --- Keep Animated Styles ---
  // These depend on flipProgress and should work correctly as flipProgress is updated by useEffect

  // Animated styles for Question Card (Face 0)
  const questionAnimatedStyle = useAnimatedStyle(() => {
    // Input: flipProgress (0 = Question, 1 = Answer, 2 = Reflection)

    // RotateY: Rotates from 0deg (visible) to 180deg (hidden backside) as flipProgress goes from 0 to 1.
    // Stays at 180deg beyond 1 (remains hidden).
    const rotateY = interpolate(
      flipProgress.value,
      [0, 1],
      [0, 180],
      Extrapolate.CLAMP
    );

    // Opacity: Fully visible at 0, fades out completely by 0.5 (midpoint of flip to Answer).
    // Stays at 0 opacity beyond 0.5.
    const opacity = interpolate(
      flipProgress.value,
      [0, 0.5],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ perspective: PERSPECTIVE }, { rotateY: `${rotateY}deg` }],
      opacity,
      // zIndex: Highest (3) when fully or partially visible (<= 0.5), then lowest (0).
      // Ensures it's on top during the first half of its flip-away animation.
      zIndex: flipProgress.value <= 0.5 ? 3 : 0,
      // pointerEvents: Active only when fully or partially visible.
      pointerEvents: flipProgress.value <= 0.5 ? 'auto' : 'none',
    };
  });

  // Animated styles for Answer Card (Face 1)
  const answerAnimatedStyle = useAnimatedStyle(() => {
    // Input: flipProgress (0 = Question, 1 = Answer, 2 = Reflection)

    // RotateY: Starts at 180deg (hidden backside), rotates to 360deg (visible front) as flipProgress goes 0 -> 1.
    // Continues rotating to 540deg (hidden backside again) as flipProgress goes 1 -> 2 (flipping towards Reflection).
    const rotateY = interpolate(
      flipProgress.value,
      [0, 1, 2],
      [180, 360, 540],
      Extrapolate.CLAMP
    );

    // Opacity: Starts at 0, fades in between 0.5 and 1 (as Question fades out).
    // Fully visible at 1. Fades out between 1 and 1.5 (as Reflection starts fading in).
    const opacity = interpolate(
      flipProgress.value,
      [0.5, 1, 1.5],
      [0, 1, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ perspective: PERSPECTIVE }, { rotateY: `${rotateY}deg` }],
      opacity,
      // zIndex: Middle (2) when it should be visible (between 0.5 and 1.5), otherwise lowest (0).
      // Ensures it's on top as Question flips away and before Reflection flips fully in.
      zIndex: flipProgress.value > 0.5 && flipProgress.value <= 1.5 ? 2 : 0,
      // pointerEvents: Active only when fully or partially visible.
      pointerEvents:
        flipProgress.value > 0.5 && flipProgress.value <= 1.5 ? 'auto' : 'none',
    };
  });

  // Animated styles for Reflection Card (Face 2)
  const reflectionAnimatedStyle = useAnimatedStyle(() => {
    // Input: flipProgress (0 = Question, 1 = Answer, 2 = Reflection)

    // RotateY: Starts at 360deg (conceptually, hidden behind Answer), rotates to 540deg as flipProgress goes 0 -> 1 (following Answer).
    // Rotates from 540deg (hidden backside) to 720deg (visible front) as flipProgress goes 1 -> 2.
    const rotateY = interpolate(
      flipProgress.value,
      [0, 1, 2],
      [360, 540, 720],
      Extrapolate.CLAMP
    );

    // Opacity: Starts at 0, fades in between 1.5 and 2 (as Answer fades out).
    // Fully visible at 2.
    const opacity = interpolate(
      flipProgress.value,
      [1.5, 2],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ perspective: PERSPECTIVE }, { rotateY: `${rotateY}deg` }],
      opacity,
      // zIndex: Lowest (1) until it starts becoming visible (at 1.5), then lowest (0) before that.
      // Ensures it's on top only when it's the final visible face.
      zIndex: flipProgress.value > 1.5 ? 1 : 0,
      // pointerEvents: Active only when fully or partially visible.
      pointerEvents: flipProgress.value > 1.5 ? 'auto' : 'none',
    };
  });

  // If not focused, prevent rendering the complex animation structure
  if (!isFocused) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.innerContainer,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 0,
          },
        ]}
      >
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
            onPress={navigateToReflection}
          >
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
