import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
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
}

/**
 * Card component that displays a word and multiple choice options
 */
const WordCardQuestionComponent: React.FC<WordCardQuestionProps> = ({ 
  wordData,
  style,
  onCorrectAnswer,
}) => {
  const { colors, spacing } = useTheme();
  const { id, word, pronunciation, partOfSpeech, options = [] } = wordData;
  
  // Zustand store hooks
  const selectedOption = useCardStore(state => state.getSelectedOption(id));
  const getOptionState = useCardStore(state => state.getOptionState);
  const selectOption = useCardStore(state => state.selectOption);
  const markWordRevealed = useWordStore(state => state.markWordRevealed);
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
  const handleOptionSelect = useCallback((option: WordOption) => {
    // Trigger haptic feedback
    Haptics.notificationAsync(
      option.isCorrect 
        ? Haptics.NotificationFeedbackType.Success 
        : Haptics.NotificationFeedbackType.Error
    );
    
    // Update selected option in store
    selectOption(id, option.value, option.isCorrect);
    
    if (option.isCorrect) {
      // Calculate attempts based on previously selected incorrect options
      // For this we need to determine how many incorrect options were selected
      // We can use the length of incorrect options in the state
      const incorrectOptionsCount = options
        .filter(opt => !opt.isCorrect && getOptionState(id, opt.value) === 'incorrect')
        .length;
      
      // Add 1 to include this attempt
      const attempts = incorrectOptionsCount + 1;
      
      // Mark word as revealed in word store
      markWordRevealed(id, attempts);
      
      // Increment words learned and update streak
      incrementWordsLearned();
      checkAndUpdateStreak();
      
      if (onCorrectAnswer) {
        onCorrectAnswer();
      }
    }
  }, [
    id, 
    options, 
    selectOption, 
    getOptionState, 
    markWordRevealed, 
    incrementWordsLearned, 
    checkAndUpdateStreak,
    onCorrectAnswer,
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
        {/* Use WordSection component */}
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
          
          {options.map((option) => (
            <OptionButton
              key={option.value}
              label={option.value}
              state={getOptionState(id, option.value)}
              onPress={() => handleOptionSelect(option)}
              disabled={isAnyOptionCorrect}
              style={{ marginBottom: spacing.md }}
            />
          ))}
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