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
  useColorScheme,
  ScrollView
} from 'react-native';
import { useNavigation } from 'expo-router';
import { WordCard, EmptyWordCard } from '../../src/components/today';
import { useThemeReady } from '../../src/hooks';
import { WordOfDay } from '../../src/types/wordOfDay';
import { wordOfDayService } from '../../src/services/wordOfDayService';
import themes from '../../src/theme/colors';
import { Text as CustomText } from '../../src/components/ui';
import { radius } from '../../src/theme/styleUtils';

// Constants
const DOT_SIZE = 32; // Size of each indicator dot
const DOT_GAP = 8;   // Gap between dots
const DOT_WIDTH = DOT_SIZE + DOT_GAP; // Total width including gap

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
  const scrollViewRef = useRef<ScrollView>(null);
  const isProgrammaticScrollRef = useRef(false);
  const loadAttempted = useRef(false);
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const systemColorScheme = useColorScheme();
  
  // Create theme-dependent styles
  const themeStyles = useMemo(() => {
    if (!theme) return {};
    
    const { colors, spacing } = theme;
    
    return {
      container: {
        flex: 1,
        backgroundColor: colors.background.primary
      } as const,
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary
      } as const,
      paginationOuterContainer: {
        paddingVertical: spacing.sm,
        alignItems: 'flex-end',
      } as const,
      paginationScrollView: {
        maxWidth: '100%',
      } as const,
      paginationContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
      } as const,
      dotTouchable: {
        padding: spacing.xs,
      } as const,
      paginationDot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: radius.circular,
        justifyContent: 'center',
        alignItems: 'center',
      } as const,
      activeDot: {
        backgroundColor: colors.primary,
        shadowColor: colors.text.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      } as const,
      inactiveDot: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
        opacity: 0.9,
      } as const,
      carouselContent: {
        alignItems: 'center',
      } as const,
      cardContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      } as any, // Type assertion for dimensions
      cardWrapper: {
        width: '90%',
        maxWidth: 500,
        flex: 1,
        paddingVertical: spacing.md,
      } as any, // Type assertion for dimensions
      wordCard: {
        width: '100%',
        flex: 1,
      } as any, // Type assertion for dimensions
    };
  }, [theme]);
  
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
    
    // Center the selected indicator in the ScrollView
    if (scrollViewRef.current) {
      const offset = index * DOT_WIDTH - (width / 2) + (DOT_WIDTH / 2);
      scrollViewRef.current.scrollTo({
        x: Math.max(0, offset),
        animated: true
      });
    }

    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true
      });
      
      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 300);
    }
  }, [width]);
  
  // Update ScrollView position when active index changes from FlatList scroll
  useEffect(() => {
    if (!isProgrammaticScrollRef.current && scrollViewRef.current) {
      const offset = activeIndex * DOT_WIDTH - (width / 2) + (DOT_WIDTH / 2);
      scrollViewRef.current.scrollTo({
        x: Math.max(0, offset),
        animated: true
      });
    }
  }, [activeIndex, width]);
  
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
      <View style={themeStyles.paginationOuterContainer}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themeStyles.paginationContainer}
          style={themeStyles.paginationScrollView}
        >
          {words.map((word, index) => {
            const isActive = index === activeIndex;
            const dateNum = getDateFromWord(word);
            
            return (
              <TouchableOpacity
                key={index}
                style={themeStyles.dotTouchable}
                onPress={() => scrollToIndex(index)}
              >
                <View
                  style={[
                    themeStyles.paginationDot,
                    isActive ? themeStyles.activeDot : themeStyles.inactiveDot,
                  ]}
                >
                  <CustomText
                    variant="caption"
                    color={isActive ? colors.text.inverse : colors.text.secondary}
                    align="center"
                    weight={isActive ? "600" : "400"}
                  >
                    {dateNum}
                  </CustomText>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [words, activeIndex, theme, getDateFromWord, scrollToIndex, themeStyles]);
  
  // Scroll indicators to end on mount
  useEffect(() => {
    if (words.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [words.length]);
  
  // Render a word card item
  const renderItem = useCallback(({ item }: { item: ExtendedWordOfDay }) => {
    const isPlaceholder = item.isPlaceholder;
    
    return (
      <View style={[themeStyles.cardContainer, { width }]}>
        <View style={themeStyles.cardWrapper}>
          {isPlaceholder ? (
            <EmptyWordCard 
              style={themeStyles.wordCard} 
              date={item.date}
            />
          ) : (
            <WordCard wordData={item} style={themeStyles.wordCard} />
          )}
        </View>
      </View>
    );
  }, [width, themeStyles]);
  
  // Show loading UI that matches theme colors
  if (!isReady || isLoading) {
    const isDark = systemColorScheme === 'dark';
    const fallbackColors = isDark ? themes.default.dark : themes.default.light;
    
    // Use theme colors if available, otherwise fallback to system colors
    const themeColors = theme?.colors || fallbackColors;
    
    return (
      <View style={themeStyles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={themeColors.primary}
        />
      </View>
    );
  }
  
  const { colors } = theme;
  
  return (
    <View style={themeStyles.container}>
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
        contentContainerStyle={themeStyles.carouselContent}
        initialScrollIndex={words.length - 1}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
    </View>
  );
}

// Static styles have been replaced with theme-based styles 