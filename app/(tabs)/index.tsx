import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { DateSelector, SwipeableWordCard } from '../../src/components/today';
import { useThemeReady } from '../../src/hooks';
import { WordOfDay } from '../../src/types/wordOfDay';
import { wordOfDayService } from '../../src/services/wordOfDayService';

export default function HomeScreen() {
  const { isReady, theme } = useThemeReady();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentWord, setCurrentWord] = useState<WordOfDay | undefined>(undefined);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  // Initialize the selected date to today
  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    setSelectedDate(todayString);
  }, []);
  
  // Load available dates and words
  useEffect(() => {
    // Get the past 14 days of words
    const words = wordOfDayService.getWordsForPastDays(14);
    
    // Extract the dates
    const dates = words.map(word => word.date);
    setAvailableDates(dates);
  }, []);
  
  // Load the word for the selected date
  useEffect(() => {
    if (selectedDate) {
      const word = wordOfDayService.getWordByDate(selectedDate);
      setCurrentWord(word);
    }
  }, [selectedDate]);
  
  // Handle date selection from the DateSelector
  const handleDateSelected = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);
  
  // Handle swiping to the previous word
  const handlePrevious = useCallback(() => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  }, [availableDates, selectedDate]);
  
  // Handle swiping to the next word
  const handleNext = useCallback(() => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  }, [availableDates, selectedDate]);
  
  // Determine if there's a previous word available
  const hasPrevious = useCallback(() => {
    const currentIndex = availableDates.indexOf(selectedDate);
    return currentIndex < availableDates.length - 1;
  }, [availableDates, selectedDate]);
  
  // Determine if there's a next word available
  const hasNext = useCallback(() => {
    const currentIndex = availableDates.indexOf(selectedDate);
    return currentIndex > 0;
  }, [availableDates, selectedDate]);
  
  // Show loading state while theme is loading
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  const { colors } = theme;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Date selector */}
      <DateSelector
        daysToShow={14}
        selectedDate={selectedDate}
        onDateSelected={handleDateSelected}
      />
      
      {/* Word card */}
      <View style={styles.wordCardContainer}>
        <SwipeableWordCard
          currentWord={currentWord}
          hasPreviousWord={hasPrevious()}
          hasNextWord={hasNext()}
          onPrevious={handlePrevious}
          onNext={handleNext}
          style={styles.swipeableCard}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordCardContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  swipeableCard: {
    marginBottom: 32,
  },
}); 