import React, { memo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../layout';
import { Text } from '../ui';
import OptionButton from './OptionButton';
import { OptionState } from './OptionButton';
import { radius, elevation } from '../../theme/styleUtils';
import { Platform } from 'react-native';
import AnimatedChip from '../ui/AnimatedChip';
import { speak, isSpeaking } from '../../utils/tts';
import * as Haptics from 'expo-haptics';

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
  const [selectedOption, setSelectedOption] = useState<string | null>(wordData.selectedOption || null);
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  const [correctOption, setCorrectOption] = useState<string | null>(null);
  const [disableOptions, setDisableOptions] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakingDuration, setSpeakingDuration] = useState(1500);
  // Track all incorrect attempts separately
  const [attemptedOptions, setAttemptedOptions] = useState<string[]>([]);
  
  // Handle pronunciation
  const handlePronunciation = async () => {
    const duration = await speak(word);
    setSpeakingDuration(duration);
    setSpeaking(true);
  };
  
  // Check speaking state
  useEffect(() => {
    if (speaking) {
      const checkInterval = setInterval(() => {
        if (!isSpeaking()) {
          setSpeaking(false);
          clearInterval(checkInterval);
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }
  }, [speaking]);
  
  // Initialize states from wordData
  useEffect(() => {
    // Reset all states when word changes
    setSelectedOption(wordData.selectedOption || null);
    setOptionStates({});
    setAttemptedOptions([]);
    setDisableOptions(false);
    
    // Find the correct option for reference
    const correct = options.find(opt => opt.isCorrect);
    if (correct) {
      setCorrectOption(correct.value);
    }
    
    // If this word has been previously answered
    if (wordData.selectedOption) {
      // Find if the selection was correct
      const selectedOptionObj = options.find(opt => opt.value === wordData.selectedOption);
      
      if (selectedOptionObj) {
        if (selectedOptionObj.isCorrect) {
          // Mark correct selection and disable options
          setOptionStates({ [wordData.selectedOption]: 'correct' });
          setDisableOptions(true);
        } else {
          // Mark incorrect selection
          setOptionStates({ [wordData.selectedOption]: 'incorrect' });
          setAttemptedOptions([wordData.selectedOption]);
        }
      }
    }
  }, [wordData.id, options]);
  
  // Handle option selection
  const handleOptionSelect = useCallback((option: WordOption) => {
    // Trigger haptic feedback
    Haptics.notificationAsync(
      option.isCorrect 
        ? Haptics.NotificationFeedbackType.Success 
        : Haptics.NotificationFeedbackType.Error
    );
    
    // Update selected option
    setSelectedOption(option.value);
    
    // If incorrect, add to attempted options
    if (!option.isCorrect) {
      setAttemptedOptions(prev => {
        if (prev.includes(option.value)) return prev;
        return [...prev, option.value];
      });
    }
    
    // Build new option states object from scratch
    const newOptionStates: Record<string, OptionState> = {};
    
    // Apply state for current selection
    newOptionStates[option.value] = option.isCorrect ? 'correct' : 'incorrect';
    
    // Preserve state for previous attempts
    attemptedOptions.forEach(attemptedOption => {
      if (attemptedOption !== option.value) { // Don't duplicate current selection
        newOptionStates[attemptedOption] = 'incorrect';
      }
    });
    
    // Update option states
    setOptionStates(newOptionStates);
    
    // If correct, disable all options
    if (option.isCorrect) {
      setDisableOptions(true);
    }
    
    // Notify parent component
    onOptionSelect(option.value, option.isCorrect);
  }, [attemptedOptions, onOptionSelect]);
  
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
                marginBottom: -4
              }}
            >
              {partOfSpeech}
            </Text>
          )}
          
          <Text 
            variant="serifTextLarge"
            color={colors.text.primary}
            align="center"
            style={{ 
              textTransform: 'lowercase', 
              marginTop: -2,
              marginBottom: spacing.sm
            }}
          >
            {word}
          </Text>
          
          {pronunciation && (
            <AnimatedChip 
              label={pronunciation}
              iconLeft="volumeLoud"
              size="small"
              onPress={handlePronunciation}
              isAnimating={speaking}
              animationDuration={speakingDuration}
            />
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
          
          {options.map((option) => (
            <OptionButton
              key={option.value} // Use option value as stable key
              label={option.value}
              state={optionStates[option.value] || 'default'}
              onPress={() => handleOptionSelect(option)}
              disabled={disableOptions && option.value !== correctOption}
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