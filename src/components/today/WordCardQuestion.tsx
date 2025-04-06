import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme';
import { Box } from '../layout';
import { Text } from '../ui';
import OptionButton from './OptionButton';
import { radius, applyElevation } from '../../theme/styleUtils';
import * as Haptics from 'expo-haptics';
import { useWordCardStore, OptionState } from '../../store/wordCardStore';
import WordSection from './WordSection';

// Character threshold for font size reduction (should match OptionButton's threshold)
const TEXT_LENGTH_THRESHOLD = 28;

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
  getWordAttempts,
}) => {
  const { colors } = useTheme();
  const { id, word, pronunciation, partOfSpeech, options = [] } = wordData;
  
  // State to track which button *should* be shaking (passed as prop)
  const [shakingOptionValue, setShakingOptionValue] = useState<string | null>(null);
  
  // Zustand store hooks
  const selectedOption = useWordCardStore(state => state.getSelectedOption(id));
  const getOptionState = useWordCardStore(state => state.getOptionState);
  const selectOptionAction = useWordCardStore(state => state.selectOption);
  
  // Find the correct option's value for reference
  const correctOptionValue = useMemo(() => {
    const correct = options.find(opt => opt.isCorrect);
    return correct?.value || null;
  }, [options]);
  
  // Check if the currently selected option is the correct one
  const isCorrectAnswerSelected = useMemo(() => {
    return selectedOption !== undefined && selectedOption === correctOptionValue;
  }, [selectedOption, correctOptionValue]);
  
  // Check if any option text exceeds the threshold
  const shouldUseSmallFont = useMemo(() => {
    return options.some(option => option.value.length > TEXT_LENGTH_THRESHOLD);
  }, [options]);
  
  // Handle option selection
  const handleOptionPress = useCallback((option: WordOption) => {
    if (isCorrectAnswerSelected) return;

    const isCorrect = option.isCorrect === true;

    // Call the store action to select option
    selectOptionAction(id, option.value, isCorrect);

    if (!isCorrect) {
      console.log(`[WordCardQuestion ${id}] Incorrect option: ${option.value}. Setting shake state.`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Set the state to indicate which button should shake
      setShakingOptionValue(option.value);
      // OptionButton will trigger animation based on its isShaking prop
      // Reset the shaking state after the animation duration (approximate)
      // NOTE: This assumes the parent knows the child animation duration.
      // A potentially cleaner way is for OptionButton to have an onShakeComplete callback.
      // But for now, setTimeout is simpler.
      const approxShakeDuration = 35 * 7 + 100; // Match segment duration * segments + buffer
      setTimeout(() => {
        setShakingOptionValue(null);
        console.log(`[WordCardQuestion ${id}] Resetting shake state for: ${option.value}`);
      }, approxShakeDuration);

    } else {
      console.log(`[WordCardQuestion ${id}] Correct option: ${option.value}`);
      // Correct answer logic (progress tracking) moved out previously
      // Ensure shake state is clear if somehow set previously
      setShakingOptionValue(null);
    }
  }, [
    id,
    isCorrectAnswerSelected,
    selectOptionAction,
  ]);

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: colors.background.card,
        ...applyElevation('sm', colors.text.primary)
      },
      style
    ]}>
      {/* Word, part of speech, pronunciation */}
      <WordSection 
        wordId={id}
        word={word}
        pronunciation={pronunciation}
        partOfSpeech={partOfSpeech}
        style={styles.wordSection}
      />
      
      {/* Question prompt */}
      <Text 
        variant="label"
        style={styles.questionText}
        color={colors.text.tertiary}
        align="center"
      >
        Which of these is the correct definition?
      </Text>
      
      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const optionState = getOptionState(id, option.value);
          const isCurrentlyShaking = shakingOptionValue === option.value;
          
          return (
            <View key={`${id}-option-${index}`} style={styles.optionWrapper}>
              <OptionButton
                option={option}
                state={optionState}
                disabled={isCorrectAnswerSelected && optionState !== 'correct'}
                useSmallFont={shouldUseSmallFont}
                onPress={() => handleOptionPress(option)}
                isShaking={isCurrentlyShaking}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  wordSection: {
    marginBottom: 24,
  },
  questionText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'stretch',
  },
  optionWrapper: {
    marginBottom: 12,
    width: '100%',
  },
});

const WordCardQuestion = memo(WordCardQuestionComponent);

export default WordCardQuestion; 