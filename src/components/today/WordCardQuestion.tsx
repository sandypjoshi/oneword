import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withRepeat 
} from 'react-native-reanimated';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme';
import { Box } from '../layout';
import { Text } from '../ui';
import OptionButton from './OptionButton';
import { radius, applyElevation } from '../../theme/styleUtils';
import * as Haptics from 'expo-haptics';
import { useCardStore } from '../../store/cardStore';
import { useWordStore } from '../../store/wordStore';
import { useProgressStore } from '../../store/progressStore';
import WordSection from './WordSection';

// Character threshold for font size reduction (should match OptionButton's threshold)
const TEXT_LENGTH_THRESHOLD = 28;

// Shake Animation constants
const SHAKE_OFFSET = 5;
const SHAKE_DURATION = 70;

interface WordCardQuestionProps {
  /**
   * Word data to display
   */
  wordData: WordOfDay;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Callback function to call when a correct answer is given
   */
  onCorrectAnswer?: () => void;
  
  /**
   * Callback function to mark a word as revealed
   */
  markWordRevealed?: (wordId: string, attempts: number) => void;
  
  /**
   * Callback function to get the current word attempts
   */
  getWordAttempts?: () => number;
}

/**
 * Card component that displays a word and multiple choice options
 */
const WordCardQuestionComponent: React.FC<WordCardQuestionProps> = ({ 
  wordData,
  style,
  onCorrectAnswer,
  markWordRevealed,
  getWordAttempts,
}) => {
  const { colors, spacing } = useTheme();
  const { id, word, pronunciation, partOfSpeech, options = [] } = wordData;
  
  // Zustand store hooks
  const selectedOption = useCardStore(state => state.getSelectedOption(id));
  const getOptionState = useCardStore(state => state.getOptionState);
  const selectOption = useCardStore(state => state.selectOption);
  const markWordRevealedInStore = useWordStore(state => state.markWordRevealed);
  const incrementWordsLearned = useProgressStore(state => state.incrementWordsLearned);
  const checkAndUpdateStreak = useProgressStore(state => state.checkAndUpdateStreak);
  
  // Find the correct option for reference
  const correctOption = useMemo(() => {
    const correct = options.find(opt => opt.isCorrect);
    return correct?.value || null;
  }, [options]);
  
  // Check if options should be disabled (correct answer already selected)
  const isAnyOptionCorrect = useMemo(() => {
    return options.some(option => 
      getOptionState(id, option.value) === 'correct'
    );
  }, [id, options, getOptionState]);
  
  // Check if any option text exceeds the threshold
  const shouldUseSmallFont = useMemo(() => {
    return options.some(option => option.value.length > TEXT_LENGTH_THRESHOLD);
  }, [options]);
  
  // State to track which button to shake
  const [shakingOptionValue, setShakingOptionValue] = useState<string | null>(null);
  
  // Shared value for shake animation
  const shakeTranslateX = useSharedValue(0);

  // Animated style for the shake
  const shakeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeTranslateX.value }],
    };
  });

  // Function to trigger shake animation
  const triggerShake = useCallback(() => {
    shakeTranslateX.value = withSequence(
      withTiming(-SHAKE_OFFSET, { duration: SHAKE_DURATION / 2 }),
      withRepeat(withTiming(SHAKE_OFFSET, { duration: SHAKE_DURATION }), 3, true),
      withTiming(0, { duration: SHAKE_DURATION / 2 })
    );
  }, [shakeTranslateX]);

  // Handle option selection
  const handleOptionSelect = useCallback((option: WordOption) => {
    if (isAnyOptionCorrect) return; // Prevent multiple selections

    const isCorrect = option.isCorrect;
    selectOption(id, option.value, isCorrect);
    
    if (isCorrect) {
      // Call markWordRevealed if provided
      if (markWordRevealed && getWordAttempts) {
        const attempts = getWordAttempts(); // Get current attempt count
        console.log(`[WordCardQuestion ${id}] Correct answer! Marking revealed with attempts: ${attempts}`);
        markWordRevealedInStore(id, attempts);
      }
      // Trigger haptic feedback
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      
      // Increment words learned and update streak
      incrementWordsLearned();
      checkAndUpdateStreak();
      
      if (onCorrectAnswer) {
        onCorrectAnswer();
      }
    } else {
      // --- Incorrect option selected ---
      // Trigger haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Set which button to shake
      setShakingOptionValue(option.value);
      // Trigger the shake animation
      triggerShake();
      // Reset shaking state after animation (approx duration)
      setTimeout(() => setShakingOptionValue(null), SHAKE_DURATION * 4);
    }
  }, [
    id, 
    options, 
    selectOption, 
    getOptionState, 
    markWordRevealedInStore, 
    incrementWordsLearned, 
    checkAndUpdateStreak,
    onCorrectAnswer,
    markWordRevealed,
    getWordAttempts,
    triggerShake,
  ]);
  
  // Define styles inside component to access spacing
  const styles = useMemo(() => StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: radius.xl,
      overflow: 'hidden',
      width: '100%',
      height: '100%',
    },
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      paddingTop: spacing.xl,
    },
    wordSection: {
      marginBottom: spacing.lg,
    },
    optionsSection: {
      justifyContent: 'flex-end',
      paddingBottom: spacing.md,
    }
  }), [spacing]);

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.light,
          ...applyElevation('sm', colors.text.primary),
        },
        style
      ]}
    >
      <Box padding="lg" style={styles.content}>
        {/* Use WordSection component - variant defaults to 'default' */}
        <WordSection 
          wordId={id}
          word={word}
          pronunciation={pronunciation}
          partOfSpeech={partOfSpeech}
          style={styles.wordSection} 
        />
        
        {/* Options section */}
        <View style={styles.optionsSection}>
          <Text 
            variant="label" 
            color={colors.text.tertiary}
            align="center"
            style={{ marginBottom: spacing.md }}
          >
            Guess the correct definition
          </Text>
          
          {options.map((option) => {
            const isShaking = shakingOptionValue === option.value;
            return (
              // Apply animated style conditionally
              <Animated.View key={option.value} style={isShaking ? shakeAnimatedStyle : {}}>
                <OptionButton
                  label={option.value}
                  state={getOptionState(id, option.value)}
                  onPress={() => handleOptionSelect(option)}
                  disabled={isAnyOptionCorrect}
                  style={{ marginBottom: spacing.md }}
                />
              </Animated.View>
            );
          })}
        </View>
      </Box>
    </View>
  );
};

// Apply memo to the component
const WordCardQuestion = memo(WordCardQuestionComponent);

// Set display name for better debugging
WordCardQuestion.displayName = 'WordCardQuestion';

export default WordCardQuestion; 