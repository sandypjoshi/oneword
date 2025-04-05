import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme';
import Box from '../layout/Box';
import Text from '../ui/Text';
import Icon, { IconName } from '../ui/Icon';
import Chip from '../ui/Chip';
import { useWordCardStore, OptionState } from '../../store/wordCardStore';
import { radius } from '../../theme/styleUtils';
import WordSection from './WordSection';

interface ReflectionCardProps {
  wordData: WordOfDay;
  style?: StyleProp<ViewStyle>;
  onNavigateToAnswer?: () => void;
  onFlipBack?: () => void;
}

/**
 * Displays a reflection card after answering the word question
 * with positive reinforcement and opportunities for further reflection
 */
const ReflectionCardComponent: React.FC<ReflectionCardProps> = ({ 
  wordData,
  style,
  onFlipBack,
}) => {
  const { colors, spacing } = useTheme();
  const { id, word, pronunciation, partOfSpeech, definition, options = [] } = wordData;
  
  // Get selected option from store
  const selectedOption = useWordCardStore(state => state.getSelectedOption(id));
  const getOptionState = useWordCardStore(state => state.getOptionState);
  
  // Find the correct option for display
  const correctOption = useMemo(() => 
    options.find(option => option.isCorrect)?.value || '',
  [options]);
  
  // Find the selected option text
  const selectedOptionText = useMemo(() => 
    options.find(option => option.value === selectedOption)?.value || '',
  [options, selectedOption]);
  
  // Check if user selected the correct option
  const isCorrect = useMemo(() => 
    getOptionState(id, correctOption) === 'correct',
  [id, correctOption, getOptionState]);
  
  // Generate reflection message based on user's answer
  const reflectionMessage = useMemo(() => {
    if (isCorrect) {
      return "Great job! You chose the correct definition. Make sure to use this word in a conversation today to reinforce your learning.";
    } else {
      return "Learning happens through mistakes. Review the correct definition and try using this word in a sentence today.";
    }
  }, [isCorrect]);
  
  // Generate a tip based on the word's part of speech
  const usageTip = useMemo(() => {
    switch (partOfSpeech?.toLowerCase()) {
      case 'noun':
        return `As a noun, "${word}" refers to ${definition.toLowerCase()}. Try using it in place of a similar noun.`;
      case 'verb':
        return `As a verb, "${word}" means to ${definition.toLowerCase()}. Try incorporating it into a sentence describing an action.`;
      case 'adjective':
        return `As an adjective, "${word}" describes ${definition.toLowerCase()}. Try using it to describe something in your environment.`;
      default:
        return `"${word}" means ${definition.toLowerCase()}. Try incorporating it into your vocabulary today.`;
    }
  }, [word, definition, partOfSpeech]);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.card }, style]}>
      <View style={styles.header}>
        <Text variant="headingMedium" align="center">
          Reflection
        </Text>
        {onFlipBack && (
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onFlipBack}
            hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <Icon name="close" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
      
      <WordSection
        wordId={id}
        word={word}
        pronunciation={pronunciation}
        partOfSpeech={partOfSpeech}
        style={styles.wordSection}
      />
      
      {/* Reflection message */}
      <View style={[
        styles.messageBox, 
        { 
          backgroundColor: isCorrect 
            ? colors.background.success 
            : colors.background.warning 
        }
      ]}>
        <Text 
          variant="label" 
          color={isCorrect ? colors.text.success : colors.text.warning} 
          style={styles.messageText}
        >
          {reflectionMessage}
        </Text>
      </View>
      
      {/* Usage tip */}
      <View style={[styles.tipBox, { backgroundColor: colors.background.tertiary }]}>
        <Text variant="label" color={colors.text.secondary} style={styles.tipHeader}>
          Usage Tip:
        </Text>
        <Text variant="bodySmall" style={styles.tipText}>
          {usageTip}
        </Text>
      </View>
      
      {/* Answer comparison if incorrect */}
      {!isCorrect && selectedOption && (
        <View style={[styles.comparisonBox, { backgroundColor: colors.background.tertiary }]}>
          <Text variant="label" color={colors.text.secondary} style={styles.comparisonHeader}>
            Your answer:
          </Text>
          <Text variant="bodySmall" color={colors.text.error} style={styles.comparisonText}>
            {selectedOptionText}
          </Text>
          
          <Text variant="label" color={colors.text.secondary} style={[styles.comparisonHeader, styles.correctHeader]}>
            Correct definition:
          </Text>
          <Text variant="bodySmall" color={colors.text.success} style={styles.comparisonText}>
            {correctOption}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  wordSection: {
    marginBottom: 24,
  },
  messageBox: {
    borderRadius: radius.md,
    marginBottom: 16,
    padding: 16,
  },
  messageText: {
    lineHeight: 20,
  },
  tipBox: {
    borderRadius: radius.md,
    marginBottom: 16,
    padding: 16,
  },
  tipHeader: {
    marginBottom: 4,
  },
  tipText: {
    lineHeight: 20,
  },
  comparisonBox: {
    borderRadius: radius.md,
    padding: 16,
  },
  comparisonHeader: {
    marginBottom: 4,
  },
  correctHeader: {
    marginTop: 12,
  },
  comparisonText: {
    marginBottom: 8,
  },
});

// Apply memo for performance
const ReflectionCard = memo(ReflectionCardComponent);

// Set display name for better debugging
ReflectionCard.displayName = 'ReflectionCard';

export default ReflectionCard; 