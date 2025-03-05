/**
 * Today Screen
 * 
 * This is the main screen that shows the word of the day and allows the user
 * to learn, practice, and track their progress.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { WordCard } from '../components/WordCard';
import { useWordService } from '../../lib/supabase/useWordService';
import { DailyWordWithDetails, WordDifficulty } from '../../lib/supabase/schema';
import { spacing } from '../../constants/theme/spacing';
import { typography } from '../../constants/theme';
import { lightColors } from '../../constants/theme/colors';

// Use light colors as default
const colors = lightColors;

export default function TodayScreen() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<WordDifficulty>(WordDifficulty.INTERMEDIATE);
  const [refreshing, setRefreshing] = useState(false);
  const { getTodayWord, submitAnswer, isLoading, error } = useWordService();
  const [todayWord, setTodayWord] = useState<DailyWordWithDetails | null>(null);

  // Fetch today's word when component mounts or difficulty changes
  useEffect(() => {
    loadTodayWord();
  }, [selectedDifficulty]);

  // Load today's word from the service
  const loadTodayWord = async (forceRefresh = false) => {
    try {
      const word = await getTodayWord(selectedDifficulty, { forceRefresh });
      setTodayWord(word);
    } catch (err) {
      console.error('Error loading today\'s word:', err);
    }
  };

  // Handle refreshing the word
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodayWord(true);
    setRefreshing(false);
  };

  // Handle answer submission
  const handleAnswerSubmit = async (isCorrect: boolean, attempts: number) => {
    if (todayWord) {
      await submitAnswer(todayWord.id, isCorrect, attempts);
    }
  };

  // Handle difficulty selection
  const handleSelectDifficulty = (difficulty: WordDifficulty) => {
    setSelectedDifficulty(difficulty);
  };

  // Render loading state
  if (isLoading && !todayWord && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading today's word...</Text>
      </View>
    );
  }

  // Render error state
  if (error && !todayWord) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Something went wrong while loading today's word.
        </Text>
        <Text style={styles.errorSubtext}>
          Pull down to refresh and try again.
        </Text>
      </View>
    );
  }

  // Render empty state (no word available)
  if (!todayWord) {
    return (
      <ScrollView 
        contentContainerStyle={styles.centerContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.noWordText}>
          No word available for today.
        </Text>
        <Text style={styles.noWordSubtext}>
          Check back later or try a different difficulty level.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Word of the Day</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.difficultySelector}>
        {Object.values(WordDifficulty).map((difficulty) => (
          <Text
            key={difficulty}
            style={[
              styles.difficultyOption,
              selectedDifficulty === difficulty && styles.selectedDifficultyOption
            ]}
            onPress={() => handleSelectDifficulty(difficulty)}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
        ))}
      </View>

      <WordCard
        word={todayWord}
        onAnswerSubmit={handleAnswerSubmit}
        style={styles.wordCard}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Remember to come back tomorrow for a new word!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.heading1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
  },
  difficultySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  difficultyOption: {
    ...typography.textStyles.labelMedium,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: 20,
    overflow: 'hidden',
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  selectedDifficultyOption: {
    backgroundColor: colors.primary,
    color: colors.textInverse,
    borderColor: colors.primary,
  },
  wordCard: {
    marginBottom: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.textStyles.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.textStyles.bodyLarge,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noWordText: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  noWordSubtext: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}); 