import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  FlatList, 
  useWindowDimensions,
  ViewToken,
  I18nManager
} from 'react-native';
import { WordCard } from '../../src/components/today';
import { useThemeReady } from '../../src/hooks';
import { WordOfDay } from '../../src/types/wordOfDay';
import { wordOfDayService } from '../../src/services/wordOfDayService';

export default function HomeScreen() {
  const { isReady, theme } = useThemeReady();
  const [words, setWords] = useState<WordOfDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();
  
  // Load words for the last 14 days
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // Get words for the past 14 days
      const recentWords = wordOfDayService.getWordsForPastDays(14);
      
      // Reverse the array so the most recent word (today) is at the end (rightmost position)
      // This is because FlatList renders from left to right
      const reversedWords = [...recentWords].reverse();
      setWords(reversedWords);
      
      // Start with today's word (now at the last index after reversing)
      setActiveIndex(reversedWords.length - 1);
      
      // Scroll to the end (today's word) after render
      setTimeout(() => {
        if (flatListRef.current && reversedWords.length > 0) {
          flatListRef.current.scrollToIndex({
            index: reversedWords.length - 1,
            animated: false
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading words:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Handle viewable items change to update the active index
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;
  
  // Show loading state while theme is loading or words are loading
  if (!isReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  const { colors } = theme;
  
  // Render pagination indicators
  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {words.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === activeIndex 
                  ? colors.primary 
                  : colors.border.light,
                width: index === activeIndex ? 10 : 8,
                height: index === activeIndex ? 10 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };
  
  // Render a word card item
  const renderItem = ({ item }: { item: WordOfDay }) => {
    return (
      <View style={[styles.cardContainer, { width }]}>
        <WordCard wordData={item} style={styles.wordCard} />
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Pagination indicators */}
      {renderPaginationDots()}
      
      {/* Word cards carousel */}
      <FlatList
        ref={flatListRef}
        data={words}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        contentContainerStyle={styles.carouselContent}
        // Disable initial scroll to start
        initialScrollIndex={words.length - 1}
        // This prevents a warning about initialScrollIndex
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
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  carouselContent: {
    alignItems: 'center',
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  wordCard: {
    width: '100%',
    maxWidth: 500,
  },
}); 