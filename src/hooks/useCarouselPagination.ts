import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ScrollView, useWindowDimensions, ViewToken } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from 'expo-router';
import { ExtendedWordOfDay } from './useDailyWords'; // Assuming ExtendedWordOfDay is exported from useDailyWords
import { useCardStore } from '../store/cardStore';
import { useWordStore } from '../store/wordStore';

// Constants
const DOT_SIZE = 32; // Size of each indicator dot
const DOT_GAP = 8;   // Gap between dots
const DOT_WIDTH = DOT_SIZE + DOT_GAP; // Total width including gap

/**
 * Hook to manage the state and interactions between the FlashList carousel
 * and the pagination dot ScrollView.
 */
export function useCarouselPagination(words: ExtendedWordOfDay[]) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const flashListRef = useRef<FlashList<ExtendedWordOfDay>>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isProgrammaticScrollRef = useRef(false);
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  const storedWords = useWordStore(state => state.words);
  const flipCard = useCardStore(state => state.flipCard);

  // Format the date nicely for the header title
  const formatDateForHeader = useCallback((word: ExtendedWordOfDay | null): string => {
    if (!word?.date) return 'Today';
    const wordDate = new Date(word.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const wordDateStr = wordDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    if (wordDateStr === todayStr) return 'Today';
    if (wordDateStr === yesterdayStr) return 'Yesterday';
    return wordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Update the header title when the active word changes
  useEffect(() => {
    if (words.length > 0 && activeIndex >= 0 && activeIndex < words.length) {
      const currentWord = words[activeIndex];
      const title = formatDateForHeader(currentWord);
      navigation.setOptions({ title });
    }
  }, [activeIndex, words, navigation, formatDateForHeader]);

  // Scroll to the initial index (today's word) when words load
  useEffect(() => {
    if (words.length > 0) {
        const initialIndex = words.length - 1;
        setActiveIndex(initialIndex);

        setTimeout(() => {
            if (flashListRef.current) {
                isProgrammaticScrollRef.current = true;
                flashListRef.current.scrollToIndex({ index: initialIndex, animated: false });
                setTimeout(() => { isProgrammaticScrollRef.current = false; }, 100);
            }
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: false });
            }
        }, 150); // Slight delay to ensure layout is ready
    }
  }, [words.length]); // Dependency on words.length to trigger only when list size changes

  // Memoize initial scroll index calculation to target today's date
  const initialScrollIndex = useMemo(() => {
    // Add defensive check to prevent errors when words is undefined
    if (!words || !Array.isArray(words) || words.length === 0) {
      return 0; // Default to first item if no words are available
    }

    const todayDateString = new Date().toISOString().split('T')[0];
    const index = words.findIndex(word => word.date === todayDateString);
    // If today not found (shouldn't happen?), default to last item, otherwise use found index.
    const result = index === -1 ? Math.max(0, words.length - 1) : index;
    console.log(`[useCarouselPagination] Today's Date: ${todayDateString}, Found Index: ${index}, Calculated initialScrollIndex: ${result}`);
    return result;
  }, [words]);

  // Handle viewable items change to update the active index
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (isProgrammaticScrollRef.current) return;
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const newIndex = viewableItems[0].index;
      console.log(`[useCarouselPagination] onViewableItemsChanged - New index: ${newIndex}`);
      setActiveIndex(newIndex);

      // Sync flip state for visible card
      const visibleItem = viewableItems[0].item as ExtendedWordOfDay;
      if (visibleItem && !visibleItem.isPlaceholder) {
        const storedWord = storedWords.find(w => w.id === visibleItem.id);
        if (storedWord?.isRevealed) {
          flipCard(visibleItem.id, true);
        }
      }
    }
  }).current;

  // Scroll to a specific index when a pagination dot is tapped
  const scrollToIndex = useCallback((index: number) => {
    isProgrammaticScrollRef.current = true;
    setActiveIndex(index);

    if (scrollViewRef.current) {
      const offset = index * DOT_WIDTH - (width / 2) + (DOT_WIDTH / 2);
      scrollViewRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }

    if (flashListRef.current) {
      flashListRef.current.scrollToIndex({ index, animated: true });
      setTimeout(() => { isProgrammaticScrollRef.current = false; }, 300);
    }
  }, [width]);

  // Update pagination ScrollView position when active index changes from FlashList scroll
  useEffect(() => {
    if (!isProgrammaticScrollRef.current && scrollViewRef.current && words.length > 0) {
      const offset = activeIndex * DOT_WIDTH - (width / 2) + (DOT_WIDTH / 2);
      scrollViewRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }
  }, [activeIndex, width, words.length]); // Add words.length dependency

  // Ensure cards are flipped correctly when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (words.length > 0 && storedWords.length > 0) {
        words.forEach(word => {
          if (word.isPlaceholder) return;
          const storedWord = storedWords.find(w => w.id === word.id);
          if (storedWord?.isRevealed) {
            flipCard(word.id, true);
          }
        });
      }
    }, [words, storedWords, flipCard])
  );

  // Memoize viewability config
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
  }), []);

  // Helper to get date number for pagination dots
  const getDateFromWord = useCallback((word: ExtendedWordOfDay): number => {
    if (!word?.date) return 0;
    try {
        const date = new Date(word.date);
        // Check if date is valid before calling getDate()
        if (!isNaN(date.getTime())) {
            return date.getDate();
        }
    } catch (e) {
        console.error("Error parsing date:", word.date, e);
    }
    return 0; // Return 0 for invalid dates
}, []);

  return {
    activeIndex,
    flashListRef,
    scrollViewRef,
    onViewableItemsChanged,
    scrollToIndex,
    viewabilityConfig,
    getDateFromWord,
    initialScrollIndex,
  };
}

export default useCarouselPagination; 