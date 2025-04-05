import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme';
import { Box } from '../layout';
import { Text } from '../ui';
import OptionButton from './OptionButton';
import { radius, applyElevation } from '../../theme/styleUtils';
import * as Haptics from 'expo-haptics';
import { useWordCardStore, OptionState } from '../../store/wordCardStore';
import { useProgressStore } from '../../store/progressStore';
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
   * Callback function to call when a correct answer is given
   */
  onCorrectAnswer?: () => void;
  
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
  getWordAttempts,
}) => {
  const { colors, spacing } = useTheme();
  const { id, word, pronunciation, partOfSpeech, options = [] } = wordData;
  
  // Zustand store hooks
  const selectedOption = useWordCardStore(state => state.getSelectedOption(id));
  const getOptionState = useWordCardStore(state => state.getOptionState);
  const selectOption = useWordCardStore(state => state.selectOption);
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
  
  // Handle option selection
  const handleOptionPress = useCallback((option: WordOption) => {
    // Skip if already answered correctly
    if (isAnyOptionCorrect) return;
    
    // Get the current attempt count
    const attemptCount = (getWordAttempts ? getWordAttempts() : 0) + 1;
    
    // Check if correct
    const isCorrect = option.isCorrect === true;
    
    // Call the store actions to select option
    selectOption(id, option.value, isCorrect);
    
    // Handle correct answer
    if (isCorrect) {
      // Update streak and words learned
      incrementWordsLearned();
      checkAndUpdateStreak();
      
      // Optional callback
      if (onCorrectAnswer) {
        onCorrectAnswer();
      }
    } 
    // Handle incorrect answer
    else {
      // Vibrate for feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [
    id, 
    isAnyOptionCorrect, 
    getWordAttempts, 
    selectOption, 
    incrementWordsLearned, 
    checkAndUpdateStreak,
    onCorrectAnswer
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
          // Get the current state for this option
          const optionState = getOptionState(id, option.value);
          
          return (
            <View 
              key={`${id}-option-${index}`}
              style={styles.optionWrapper}
            >
              <OptionButton
                option={option}
                state={optionState}
                disabled={isAnyOptionCorrect && optionState !== 'correct'}
                useSmallFont={shouldUseSmallFont}
                onPress={() => handleOptionPress(option)}
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

export default memo(WordCardQuestionComponent); 