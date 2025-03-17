import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  FlatList, 
  useWindowDimensions,
  ViewToken,
  TouchableOpacity,
  Text,
  useColorScheme
} from 'react-native';
import { useNavigation } from 'expo-router';
import { WordCard, EmptyWordCard } from '../../src/components/today';
import { useThemeReady } from '../../src/hooks';
import { WordOfDay } from '../../src/types/wordOfDay';
import { wordOfDayService } from '../../src/services/wordOfDayService';
import colorThemes from '../../src/theme/colors';

// Extended WordOfDay type to include placeholder flag
interface ExtendedWordOfDay extends WordOfDay {
  isPlaceholder?: boolean;
}

export default function HomeScreen() {
  const { isReady, theme } = useThemeReady();
  const [words, setWords] = useState<ExtendedWordOfDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const isProgrammaticScrollRef = useRef(false);
  const loadAttempted = useRef(false);
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const systemColorScheme = useColorScheme();
  
  // Format the date nicely for the header title
  const formatDateForHeader = useCallback((word: ExtendedWordOfDay | null): string => {
    if (!word?.date) return 'Today'; // Default fallback

    const wordDate = new Date(word.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates for comparison (strip time portion)
    const wordDateStr = wordDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    if (wordDateStr === todayStr) {
      return 'Today';
    } else if (wordDateStr === yesterdayStr) {
      return 'Yesterday';
    } else {
      // Format as "Mar 15" for older dates
      return wordDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }, []);
  
  // Extract date number from ISO date string
  const getDateFromWord = useCallback((word: ExtendedWordOfDay): number => {
    if (!word?.date) return 0;
    const date = new Date(word.date);
    return date.getDate();
  }, []);
  
  // Load words for the last 14 days and ensure there's an entry for each day
  useEffect(() => {
    // Skip if we're not ready for rendering yet
    if (!isReady || loadAttempted.current) return;
    
    loadAttempted.current = true;
    
    const loadWords = async () => {
      setIsLoading(true);
      
      try {
        // Get words for the past 14 days
        const recentWords = wordOfDayService.getWordsForPastDays(14);
        
        // Create a complete array of the last 14 days, with placeholders for missing days
        const today = new Date();
        const allDays: ExtendedWordOfDay[] = [];
        
        // Generate dates for the past 14 days
        // IMPORTANT: This loop generates dates in chronological order (oldest → newest)
        // The loop starts from the oldest date (i=13, 13 days ago) and ends with today (i=0)
        // This ensures our FlatList will show past days on the left and today on the right
        for (let i = 13; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          
          // Find if we have a word for this date
          const wordForDate = recentWords.find(word => {
            const wordDate = new Date(word.date);
            return wordDate.toISOString().split('T')[0] === dateString;
          });
          
          // If word exists, add it, otherwise add placeholder
          if (wordForDate) {
            allDays.push(wordForDate);
          } else {
            // Create placeholder with date information
            allDays.push({
              id: `placeholder-${dateString}`,
              word: '',
              pronunciation: '',
              partOfSpeech: '',
              definition: '',
              date: dateString,
              isPlaceholder: true
            });
          }
        }
        
        // ORDERING: Keep this array in chronological order (oldest → newest)
        // DO NOT REVERSE THIS ARRAY - it's already in the correct order
        // Left side (index 0) = oldest date, Right side (last index) = today
        setWords(allDays);
        
        // Start with today's word (last index in chronological order)
        const lastIndex = allDays.length - 1;
        setActiveIndex(lastIndex);
        
        // Scroll to the end (today's word) after render
        setTimeout(() => {
          if (flatListRef.current && allDays.length > 0) {
            isProgrammaticScrollRef.current = true;
            flatListRef.current.scrollToIndex({
              index: lastIndex,
              animated: false
            });
            // Reset flag after a short delay to account for scroll completion
            setTimeout(() => {
              isProgrammaticScrollRef.current = false;
            }, 100);
          }
        }, 100);
      } catch (error) {
        console.error('Error loading words:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWords();
  }, [isReady]);
  
  // Update the header title when the active word changes
  useEffect(() => {
    if (words.length > 0 && activeIndex >= 0 && activeIndex < words.length) {
      const currentWord = words[activeIndex];
      const title = formatDateForHeader(currentWord);
      navigation.setOptions({ title });
    }
  }, [activeIndex, words, navigation, formatDateForHeader]);
  
  // Handle viewable items change to update the active index
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Ignore viewability changes if we're in the middle of a programmatic scroll
    if (isProgrammaticScrollRef.current) return;
    
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;
  
  // Scroll to a specific index when a pagination dot is tapped
  const scrollToIndex = useCallback((index: number) => {
    // Set the flag to indicate we're doing a programmatic scroll
    isProgrammaticScrollRef.current = true;
    
    // Immediately update the active index for a smooth visual transition
    setActiveIndex(index);
    
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true
      });
      
      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 300); // Slightly longer than animation duration
    }
  }, []);
  
  // Memoize viewability config to prevent recreating it on every render
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
  }), []);
  
  // Memoize getItemLayout for better FlatList performance
  const getItemLayout = useCallback((
    _: any, 
    index: number
  ) => ({
    length: width,
    offset: width * index,
    index,
  }), [width]);
  
  // Render pagination indicators
  const renderPaginationDots = useCallback(() => {
    if (!theme || !words.length) return null;
    
    const { colors } = theme;
    return (
      <View style={styles.paginationContainer}>
        {words.map((word, index) => {
          const isActive = index === activeIndex;
          const dateNum = getDateFromWord(word);
          const isPlaceholder = word.isPlaceholder;
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => scrollToIndex(index)}
              activeOpacity={0.6}
              style={styles.dotTouchable}
            >
              <View
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: isActive 
                      ? colors.primary 
                      : isPlaceholder 
                        ? colors.border.medium
                        : colors.text.secondary,
                    width: isActive ? 24 : 8,
                    height: isActive ? 24 : 8,
                    opacity: isActive ? 1 : isPlaceholder ? 0.4 : 0.6,
                  },
                ]}
              >
                {isActive && (
                  <Text style={[styles.dateNumber, { color: colors.text.inverse }]}>
                    {dateNum}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [words, activeIndex, theme, getDateFromWord, scrollToIndex]);
  
  // Render a word card item
  const renderItem = useCallback(({ item }: { item: ExtendedWordOfDay }) => {
    const isPlaceholder = item.isPlaceholder;
    
    return (
      <View style={[styles.cardContainer, { width }]}>
        {isPlaceholder ? (
          <EmptyWordCard 
            style={styles.wordCard} 
            date={item.date}
          />
        ) : (
          <WordCard wordData={item} style={styles.wordCard} />
        )}
      </View>
    );
  }, [width]);
  
  // Show loading UI that matches theme colors
  if (!isReady || isLoading) {
    const isDark = systemColorScheme === 'dark';
    const fallbackColors = isDark ? colorThemes.dark : colorThemes.light;
    
    // Use theme colors if available, otherwise fallback to system colors
    const themeColors = theme?.colors || fallbackColors;
    
    return (
      <View style={[
        styles.loadingContainer, 
        { backgroundColor: themeColors.background.primary }
      ]}>
        <ActivityIndicator 
          size="large" 
          color={themeColors.primary}
        />
      </View>
    );
  }
  
  const { colors } = theme;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Pagination indicators */}
      {renderPaginationDots()}
      
      {/* Word cards carousel */}
      {/* 
        FlatList displays words in chronological order:
        - LEFT side = oldest words (past days)
        - RIGHT side = newest word (today)
        - initialScrollIndex is set to the last item (today) to start the view from the right
      */}
      <FlatList
        ref={flatListRef}
        data={words}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.carouselContent}
        initialScrollIndex={words.length - 1}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  dotTouchable: {
    padding: 8, // Increase touch target area
    marginHorizontal: -4, // Compensate for padding to keep dots visually spaced correctly
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  carouselContent: {
    alignItems: 'center',
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  wordCard: {
    width: '100%',
    maxWidth: 500,
  },
}); 