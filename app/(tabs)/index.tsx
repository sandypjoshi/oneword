import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  useWindowDimensions,
  ViewToken,
  TouchableOpacity,
  Text,
  useColorScheme,
  ScrollView
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from 'expo-router';
import { WordCard, EmptyWordCard } from '../../src/components/today';
import WordDetailsBottomSheet, { WordDetailsBottomSheetRef } from '../../src/components/today/WordDetailsBottomSheet';
import { useThemeReady } from '../../src/hooks';
import { WordOfDay } from '../../src/types/wordOfDay';
import { wordOfDayService } from '../../src/services/wordOfDayService';
import themes from '../../src/theme/colors';
import { Text as CustomText } from '../../src/components/ui';
import { radius, applyElevation } from '../../src/theme/styleUtils';
import { useWordStore } from '../../src/store/wordStore';
import { useCardStore } from '../../src/store/cardStore';

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
  const [selectedWord, setSelectedWord] = useState<WordOfDay | null>(null);
  
  const flashListRef = useRef<FlashList<ExtendedWordOfDay>>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const bottomSheetRef = useRef<WordDetailsBottomSheetRef>(null);
  const isProgrammaticScrollRef = useRef(false);
  const loadAttempted = useRef(false);
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const systemColorScheme = useColorScheme();
  
  // Add these Zustand store hooks
  const storedWords = useWordStore(state => state.words);
  const flipCard = useCardStore(state => state.flipCard);
  
  // Create theme-dependent styles
  const themeStyles = useMemo(() => {
    if (!theme) return {};
    
    const { colors, spacing } = theme;
    
    return {
      container: {
        flex: 1,
        backgroundColor: colors.background.primary,
        paddingBottom: spacing.xl,
      } as const,
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary
      } as const,
      paginationOuterContainer: {
        paddingVertical: spacing.xs,
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
        ...applyElevation('xs', colors.text.primary),
      } as const,
      inactiveDot: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
        opacity: 0.9,
      } as const,
      carouselContent: {
        alignItems: 'center',
        paddingBottom: spacing.md,
      } as const,
      cardContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        paddingBottom: spacing.xl,
        paddingTop: spacing.xs,
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
  
  // Memoize card dimensions to avoid unnecessary renders
  const cardDimensions = useMemo(() => ({
    width,
    containerPadding: theme?.spacing.md
  }), [width, theme?.spacing.md]);
  
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
  
  // Add this effect to ensure revealed words show the answer card
  useEffect(() => {
    // Once words are loaded, check which ones have been revealed
    if (words.length > 0 && storedWords.length > 0) {
      // For each word, if it's marked as revealed in the wordStore,
      // flip its card in the cardStore
      words.forEach(word => {
        const storedWord = storedWords.find(w => w.id === word.id);
        if (storedWord?.isRevealed) {
          flipCard(word.id, true);
        }
      });
    }
  }, [words, storedWords, flipCard]);
  
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
        // Important: This loop generates dates in chronological order (oldest → newest)
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
            // Check if we have stored data for this word
            const storedWord = storedWords.find(w => w.id === wordForDate.id);
            // Merge the stored data (like isRevealed) with the word data
            if (storedWord) {
              const wordWithState = {
                ...wordForDate,
                isRevealed: storedWord.isRevealed,
                userAttempts: storedWord.userAttempts
              };
              allDays.push(wordWithState);
              
              // Ensure the card is flipped if the word is revealed
              if (storedWord.isRevealed) {
                // Delay this to ensure store is fully initialized
                setTimeout(() => flipCard(wordForDate.id, true), 100);
              }
            } else {
              allDays.push(wordForDate);
            }
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
          if (flashListRef.current && allDays.length > 0) {
            isProgrammaticScrollRef.current = true;
            flashListRef.current.scrollToIndex({
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
      const newIndex = viewableItems[0].index || 0;
      setActiveIndex(newIndex);
      
      // Ensure visible word's card state is synchronized with its revealed state
      const visibleItem = viewableItems[0].item as ExtendedWordOfDay;
      if (visibleItem && !visibleItem.isPlaceholder) {
        const storedWord = storedWords.find(w => w.id === visibleItem.id);
        if (storedWord?.isRevealed) {
          // Make sure this card is flipped if it's been revealed
          flipCard(visibleItem.id, true);
        }
      }
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

    if (flashListRef.current) {
      flashListRef.current.scrollToIndex({
        index,
        animated: true
      });
      
      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 300);
    }
  }, [width]);
  
  // Update ScrollView position when active index changes from FlashList scroll
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
                    weight={isActive ? "700" : "400"}
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
  
  // Handle bottom sheet dismiss
  const handleBottomSheetDismiss = useCallback(() => {
    // Any cleanup needed after closing the sheet
  }, []);
  
  // Render a word card item
  const renderItem = useCallback(({ item }: { item: ExtendedWordOfDay }) => {
    const isPlaceholder = item.isPlaceholder;
    
    return (
      <View style={[themeStyles.cardContainer, { width: cardDimensions.width }]}>
        <View style={themeStyles.cardWrapper}>
          {isPlaceholder ? (
            <EmptyWordCard 
              style={themeStyles.wordCard} 
              date={item.date}
            />
          ) : (
            <WordCard 
              wordData={item} 
              style={themeStyles.wordCard} 
              onViewDetails={() => {
                // Set the selected word for the bottom sheet
                setSelectedWord(item);
                // Open the bottom sheet
                bottomSheetRef.current?.open();
              }}
            />
          )}
        </View>
      </View>
    );
  }, [cardDimensions.width, themeStyles.cardContainer, themeStyles.cardWrapper, themeStyles.wordCard]);
  
  // Add this effect after initializing the wordStore
  useEffect(() => {
    // Add some mock data with multiple definitions for testing purposes
    if (words.length > 0) {
      // Clone the current words array
      const updatedWords = [...words];
      
      // Add multiple definitions to the first few words if they exist
      if (updatedWords[0] && !updatedWords[0].isPlaceholder) {
        // Update word with multiple definitions
        updatedWords[0] = {
          ...updatedWords[0],
          definition: [
            "Too great or extreme to be expressed in words",
            "Too sacred to be uttered",
            "Incapable of being expressed; indescribable or unutterable"
          ] as unknown as string // Type assertion for testing
        };
      }
      
      if (updatedWords[1] && !updatedWords[1].isPlaceholder) {
        // Update another word with multiple definitions
        updatedWords[1] = {
          ...updatedWords[1],
          definition: [
            "Having or showing the capacity to develop into something in the future",
            "Relating to or denoting factors that increase the propensity to follow a particular developmental sequence"
          ] as unknown as string // Type assertion for testing
        };
      }
      
      // Update the state with our modified words
      setWords(updatedWords);
    }
  }, [words.length]);
  
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
        FlashList displays words in chronological order:
        - LEFT side = oldest words (past days)
        - RIGHT side = newest word (today)
        - initialScrollIndex is set to the last item (today) to start the view from the right
      */}
      <FlashList
        ref={flashListRef}
        data={words}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        estimatedItemSize={width}
        initialScrollIndex={words.length - 1}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        contentInsetAdjustmentBehavior="automatic"
        disableScrollViewPanResponder={true}
        drawDistance={width * 3}
        scrollEnabled={true}
        ListEmptyComponent={<View style={{ height: 200 }} />}
        decelerationRate="normal"
        bounces={true}
      />
      
      {/* Word details bottom sheet (screen-level) */}
      {selectedWord && (
        <WordDetailsBottomSheet
          ref={bottomSheetRef}
          wordData={selectedWord}
          onDismiss={handleBottomSheetDismiss}
        />
      )}
    </View>
  );
}

// Static styles have been replaced with theme-based styles 