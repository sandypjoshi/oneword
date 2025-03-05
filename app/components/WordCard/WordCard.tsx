/**
 * WordCard Component
 * 
 * This component displays a word of the day card with its definition, pronunciation,
 * part of speech, and additional information. It also provides interactive elements
 * for the user to learn the word.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyWordWithDetails } from '../../../lib/supabase/schema';
import { typography } from '../../../constants/theme';
import { lightColors } from '../../../constants/theme/colors';
import { borderRadius, spacing } from '../../../constants/theme/spacing';
import { useWordService } from '../../../lib/supabase/useWordService';

// Use light colors as default
const colors = lightColors;

interface WordCardProps {
  word: DailyWordWithDetails;
  onAnswerSubmit?: (isCorrect: boolean, attempts: number, timeSpent?: number) => void;
  style?: any;
}

export function WordCard({ word, onAnswerSubmit, style }: WordCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const { toggleFavorite, isLoading } = useWordService();
  
  // Check if the word is favorited
  const isFavorited = word.progress?.favorited || false;

  // Handle selecting an option (answer)
  const handleSelectOption = (index: number) => {
    if (revealed) return; // Prevent selection after answer is revealed
    
    setSelectedOptionIndex(index);
    
    // Increment attempts
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    // Check if correct
    const isCorrect = index === word.correct_option_index;
    
    // If correct or max attempts reached, reveal the answer
    if (isCorrect || newAttempts >= 2) {
      setRevealed(true);
      onAnswerSubmit?.(isCorrect, newAttempts);
    }
  };
  
  // Handle toggling favorite status
  const handleToggleFavorite = async () => {
    await toggleFavorite(word.id);
  };
  
  // Determine the correct pronunciation display
  const pronunciation = word.word.pronunciation 
    ? `/${word.word.pronunciation}/` 
    : '';
  
  // Get the correct definition from the options
  const correctDefinition = word.options[word.correct_option_index];
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.difficulty}>{word.difficulty.toUpperCase()}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={handleToggleFavorite}
          >
            <Ionicons 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorited ? colors.error : colors.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.wordContainer}>
        <Text style={styles.word}>{word.word.word}</Text>
        {pronunciation ? (
          <Text style={styles.pronunciation}>{pronunciation}</Text>
        ) : null}
        {word.word.part_of_speech ? (
          <Text style={styles.partOfSpeech}>{word.word.part_of_speech}</Text>
        ) : null}
      </View>
      
      <View style={styles.quizContainer}>
        <Text style={styles.quizTitle}>What does this word mean?</Text>
        
        {word.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedOptionIndex === index && styles.selectedOption,
              revealed && index === word.correct_option_index && styles.correctOption,
              revealed && selectedOptionIndex === index && index !== word.correct_option_index && styles.incorrectOption,
            ]}
            onPress={() => handleSelectOption(index)}
            disabled={revealed}
          >
            <Text 
              style={[
                styles.optionText,
                selectedOptionIndex === index && styles.selectedOptionText,
                revealed && index === word.correct_option_index && styles.correctOptionText,
                revealed && selectedOptionIndex === index && index !== word.correct_option_index && styles.incorrectOptionText,
              ]}
              numberOfLines={3}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {revealed && (
        <View style={styles.additionalInfo}>
          {word.word.examples && word.word.examples.length > 0 && (
            <View style={styles.examplesContainer}>
              <Text style={styles.sectionTitle}>Example:</Text>
              <Text style={styles.example}>{word.word.examples[0]}</Text>
            </View>
          )}
          
          {word.word.synonyms && word.word.synonyms.length > 0 && (
            <View style={styles.synonymsContainer}>
              <Text style={styles.sectionTitle}>Synonyms:</Text>
              <Text style={styles.synonyms}>
                {word.word.synonyms.slice(0, 5).join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  difficulty: {
    ...typography.textStyles.labelSmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  favoriteButton: {
    padding: spacing.xs,
  },
  wordContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  word: {
    ...typography.textStyles.displaySmall,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pronunciation: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  partOfSpeech: {
    ...typography.textStyles.bodySmall,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  quizContainer: {
    marginBottom: spacing.md,
  },
  quizTitle: {
    ...typography.textStyles.heading5,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  option: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  correctOption: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 204, 16, 0.1)',
  },
  incorrectOption: {
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 37, 17, 0.1)',
  },
  optionText: {
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  selectedOptionText: {
    color: colors.primary,
  },
  correctOptionText: {
    color: colors.success,
  },
  incorrectOptionText: {
    color: colors.error,
  },
  additionalInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  examplesContainer: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.textStyles.heading6,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  example: {
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  synonymsContainer: {
    marginBottom: spacing.md,
  },
  synonyms: {
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
  },
}); 