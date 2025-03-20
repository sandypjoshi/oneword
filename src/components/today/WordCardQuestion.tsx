import React, { memo, useState, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../layout';
import { Text } from '../ui';
import OptionButton from './OptionButton';
import { OptionState } from './OptionButton';
import { radius, elevation } from '../../theme/styleUtils';
import { Platform } from 'react-native';

interface WordCardQuestionProps {
  /**
   * Word data to display
   */
  wordData: WordOfDay;
  
  /**
   * Function called when an option is selected
   */
  onOptionSelect: (option: string, isCorrect: boolean) => void;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Card component that displays a word and multiple choice options
 */
const WordCardQuestionComponent: React.FC<WordCardQuestionProps> = ({ 
  wordData,
  onOptionSelect,
  style 
}) => {
  const { colors, spacing } = useTheme();
  const { word, pronunciation, partOfSpeech, options = [] } = wordData;
  
  // Local state to track selected option
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  
  // Handle option selection
  const handleOptionSelect = useCallback((option: WordOption) => {
    // If already selected or options revealed, do nothing
    if (selectedOption !== null && Object.values(optionStates).some(state => 
      state === 'correct' || state === 'incorrect')) {
      return;
    }
    
    // Update the selected option
    setSelectedOption(option.value);
    
    // First, mark the selected option
    const newOptionStates: Record<string, OptionState> = {
      [option.value]: 'selected'
    };
    
    // If correct, mark it correct after a short delay
    if (option.isCorrect) {
      setTimeout(() => {
        setOptionStates({
          [option.value]: 'correct'
        });
        onOptionSelect(option.value, true);
      }, 500);
    } else {
      // If incorrect, mark it incorrect after a short delay
      setTimeout(() => {
        // Find the correct option
        const correctOption = options.find(opt => opt.isCorrect);
        
        setOptionStates({
          [option.value]: 'incorrect',
          ...(correctOption ? { [correctOption.value]: 'correct' } : {})
        });
        
        onOptionSelect(option.value, false);
      }, 500);
    }
    
    setOptionStates(newOptionStates);
  }, [selectedOption, optionStates, options, onOptionSelect]);
  
  return (
    <View 
      style={[
        {
          borderWidth: 1,
          ...elevation.sm,
          overflow: 'hidden',
          flex: 1,
          display: 'flex',
          backgroundColor: colors.background.card,
          borderColor: colors.border.light,
          borderRadius: radius.xl,
        },
        style
      ]}
    >
      <Box padding="lg" style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Word section */}
        <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
          {partOfSpeech && (
            <Text
              variant="caption"
              color={colors.text.secondary}
              italic={true}
              style={{ 
                textAlign: 'center',
                textTransform: 'lowercase',
                marginBottom: spacing.xxs
              }}
            >
              {partOfSpeech}
            </Text>
          )}
          
          <Text 
            variant="serifTextMedium"
            color={colors.text.primary}
            align="center"
            style={{ 
              textTransform: 'lowercase', 
              marginVertical: spacing.sm
            }}
          >
            {word}
          </Text>
          
          {pronunciation && (
            <Text
              variant="bodySmall"
              color={colors.text.secondary}
              align="center"
              style={{ marginTop: spacing.xs }}
            >
              {pronunciation}
            </Text>
          )}
        </View>
        
        {/* Options section */}
        <View style={{ paddingTop: spacing.lg }}>
          <Text 
            variant="label" 
            color={colors.text.secondary}
            align="center"
            style={{ marginBottom: spacing.md }}
          >
            Select the correct definition
          </Text>
          
          {options.map((option, index) => (
            <OptionButton
              key={`option-${index}`}
              label={option.value}
              state={optionStates[option.value] || 'default'}
              onPress={() => handleOptionSelect(option)}
              style={{ marginBottom: spacing.md }}
            />
          ))}
        </View>
      </Box>
    </View>
  );
};

// Apply memo to prevent unnecessary re-renders
const WordCardQuestion = memo(WordCardQuestionComponent);

// Set display name for better debugging
WordCardQuestion.displayName = 'WordCardQuestion';

export default WordCardQuestion; 