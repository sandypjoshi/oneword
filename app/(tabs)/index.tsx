import React, { useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { WordCard, EmptyWordCard } from '../../src/components/today';
import WordDetailsBottomSheet from '../../src/components/today/WordDetailsBottomSheet';
import {
  useThemeReady,
  useDailyWords,
  useCarouselPagination,
  useWordDetailsSheet,
} from '../../src/hooks';
import { WordOfDay } from '../../src/types/wordOfDay';
import { Text as CustomText, Button } from '../../src/components/ui';
import { radius, applyElevation } from '../../src/theme/styleUtils';
import themes from '../../src/theme/colors'; // Keep for loading state fallback
import { Box } from '../../src/components/layout'; // Import Box for skeleton
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { useWordCardStore } from '../../src/store/wordCardStore';

// Define ExtendedWordOfDay locally if not exported properly or redefine if needed
interface ExtendedWordOfDay extends WordOfDay {
  isPlaceholder?: boolean;
}

// Constants for pagination dots
const DOT_SIZE = 32;
const DOT_GAP = 8;

export default function HomeScreen() {
  const { isReady, theme } = useThemeReady();
  const { width } = useWindowDimensions();

  // Use the word hook
  const {
    words,
    isLoading: wordsLoading,
    error,
    refetchWords,
  } = useDailyWords();

  // Pagination hook for displaying and navigating through dots
  const {
    activeIndex,
    scrollViewRef,
    onViewableItemsChanged,
    scrollToIndex,
    viewabilityConfig,
    getDateFromWord,
    initialScrollIndex,
    flashListRef,
  } = useCarouselPagination(words);

  // Combine loading states
  const isLoading = !isReady || wordsLoading;

  // Use the new custom hooks
  const { bottomSheetRef, selectedWord, openWordDetails, handleSheetDismiss } =
    useWordDetailsSheet();

  // Add state debugging
  console.log('[HomeScreen] Rendering component');

  // Create theme-dependent styles (mostly unchanged)
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
        backgroundColor: colors.background.primary,
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
      cardContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        paddingBottom: spacing.xl,
        paddingTop: spacing.xs,
      } as ViewStyle,
      cardWrapper: {
        width: '90%',
        maxWidth: 500,
        flex: 1,
        paddingVertical: spacing.md,
      } as ViewStyle,
      wordCard: {
        width: '100%',
        flex: 1,
      } as ViewStyle,
    };
  }, [theme]);

  // Render pagination indicators using data from useCarouselPagination
  const renderPaginationDots = useCallback(() => {
    // Add more defensive checks
    if (
      !theme ||
      !words ||
      !Array.isArray(words) ||
      words.length === 0 ||
      !themeStyles.paginationOuterContainer
    ) {
      return null;
    }

    // Check if activeIndex is undefined/null or not a number, instead of just truthiness
    if (
      activeIndex === undefined ||
      activeIndex === null ||
      typeof activeIndex !== 'number' ||
      !getDateFromWord
    ) {
      console.log('[HomeScreen] Missing pagination dependencies', {
        activeIndex,
        hasGetDateFn: !!getDateFromWord,
      });
      return null;
    }

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
            if (!word) return null;

            const isActive = index === activeIndex;
            const dateNum = getDateFromWord(word);
            return (
              <TouchableOpacity
                key={word.id || `word-${index}`} // Fallback key if id is missing
                style={themeStyles.dotTouchable}
                onPress={() => scrollToIndex?.(index)}
              >
                <View
                  style={[
                    themeStyles.paginationDot,
                    isActive ? themeStyles.activeDot : themeStyles.inactiveDot,
                  ]}
                >
                  <CustomText
                    variant="caption"
                    color={
                      isActive ? colors.text.inverse : colors.text.secondary
                    }
                    align="center"
                    weight={isActive ? '700' : '400'}
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
  }, [
    words,
    activeIndex,
    theme,
    getDateFromWord,
    scrollToIndex,
    themeStyles,
    scrollViewRef,
  ]);

  // Render a word card item using the composite WordCard
  const renderItem = useCallback(
    ({ item }: { item: ExtendedWordOfDay }) => {
      // Log props being passed to WordCard
      console.log(
        `[HomeScreen.renderItem] Rendering WordCard for ID: ${item.id}, Placeholder: ${!!item.isPlaceholder}`
      );
      const isPlaceholder = item.isPlaceholder;
      return (
        <View style={[themeStyles.cardContainer, { width }]}>
          <View style={themeStyles.cardWrapper}>
            {isPlaceholder ? (
              <EmptyWordCard style={themeStyles.wordCard} date={item.date} />
            ) : (
              // Render the composite WordCard
              <WordCard
                wordData={item}
                style={themeStyles.wordCard}
                onViewDetails={() => openWordDetails(item)}
              />
            )}
          </View>
        </View>
      );
    },
    [width, themeStyles, openWordDetails]
  ); // Dependencies updated

  // Log component mount
  useEffect(() => {
    console.log('[HomeScreen] Component mounted');

    // Log the current state from wordCardStore using the NEW structure
    const state = useWordCardStore.getState();
    const wordIds = Object.keys(state.words || {});
    const revealedWordIds = state.getRevealedWords(); // Use the selector

    console.log('[HomeScreen] Current wordCardStore state on mount:', {
      totalWordsInStore: wordIds.length,
      revealedCount: revealedWordIds.length,
      // Optionally log revealed IDs or face details if needed for debugging:
      // revealedDetails: revealedWordIds.join(', '),
      // faceDetails: wordIds.map(id => `${id}: ${state.words[id]?.face || 'N/A'}`).join(', ')
    });

    return () => {
      console.log('[HomeScreen] Component will unmount');
    };
  }, []); // Empty dependency array means this runs only on mount

  // Add focus effect to track tab navigation
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Screen focused');

      // Check the wordCardStore state when the tab is focused (using NEW structure)
      const state = useWordCardStore.getState();
      const wordIds = Object.keys(state.words || {});
      const revealedWordIds = state.getRevealedWords(); // Use the selector

      console.log('[HomeScreen] wordCardStore state on focus:', {
        totalWordsInStore: wordIds.length,
        revealedCount: revealedWordIds.length,
      });

      // Potential: Add logic here if something needs to happen based on state when screen focuses

      return () => {
        console.log('[HomeScreen] Screen lost focus');
      };
    }, []) // Empty dependency array is correct for useFocusEffect's callback pattern
  );

  // Show loading UI - Simplified with basic skeleton idea
  if (isLoading) {
    const fallbackColors = themes.default.light;
    const themeColors = theme?.colors || fallbackColors;
    const themeSpacing = theme?.spacing || {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    };

    // Basic Skeleton Layout
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: themeColors.background.primary },
        ]}
      >
        {/* Skeleton for Pagination Dots */}
        <Box
          padding="xs"
          alignItems="flex-end"
          width="100%"
          style={[styles.skeletonOpacity, { paddingVertical: themeSpacing.xs }]}
        >
          <Box flexDirection="row" paddingHorizontal="lg" gap="sm">
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  borderRadius: radius.circular,
                  backgroundColor: themeColors.text.tertiary,
                  marginHorizontal: DOT_GAP / 2,
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Skeleton for Card Area */}
        <Box
          flex={1}
          width="90%"
          maxWidth={500}
          paddingVertical="md"
          alignItems="center"
          justifyContent="center"
          style={styles.skeletonOpacity}
        >
          <View
            style={[
              styles.skeletonCard, // Apply skeletonCard style
              {
                backgroundColor: themeColors.background.secondary,
                borderRadius: radius.xl,
                padding: themeSpacing.lg,
              },
            ]}
          >
            {/* Placeholder content inside card */}
            <View
              style={[
                styles.skeletonLine1, // Apply skeletonLine1 style
                {
                  backgroundColor: themeColors.text.tertiary,
                  borderRadius: radius.sm,
                  marginBottom: themeSpacing.lg,
                },
              ]}
            />
            <View
              style={[
                styles.skeletonLine2, // Apply skeletonLine2 style
                {
                  backgroundColor: themeColors.text.tertiary,
                  borderRadius: radius.sm,
                  marginBottom: themeSpacing.md,
                },
              ]}
            />
            <View
              style={[
                styles.skeletonLine3, // Apply skeletonLine3 style
                {
                  backgroundColor: themeColors.text.tertiary,
                  borderRadius: radius.pill,
                },
              ]}
            />
          </View>
        </Box>

        {/* Optional: Keep spinner as well or replace entirely */}
        {/* <ActivityIndicator size="large" color={themeColors.primary} style={{ position: 'absolute' }}/> */}
      </View>
    );
  }

  // Handle potential errors during word fetching
  if (error) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme?.colors.background.primary },
        ]}
      >
        <CustomText
          color={theme?.colors.text.error || 'red'}
          style={{ marginBottom: theme?.spacing.md || 16 }}
        >
          Error loading words: {error.message}
        </CustomText>
        <Button
          title="Retry"
          onPress={refetchWords}
          variant="primary"
          size="small"
        />
      </View>
    );
  }

  // Main component render
  return (
    <View style={themeStyles.container}>
      {renderPaginationDots()}

      {words && Array.isArray(words) && (
        <FlashList
          ref={flashListRef}
          data={words}
          renderItem={renderItem}
          keyExtractor={item => item?.id || String(Math.random())}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          estimatedItemSize={width}
          initialScrollIndex={
            initialScrollIndex !== undefined ? initialScrollIndex : 0
          }
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          contentInsetAdjustmentBehavior="automatic"
          // These props might need review based on performance/behavior
          // disableScrollViewPanResponder={true}
          // drawDistance={width * 3}
          scrollEnabled={true}
          // ListEmptyComponent={<View style={{ height: 200 }} />} // Can add a proper empty state
          decelerationRate="fast" // Changed to fast for snappier feel
          bounces={true}
        />
      )}

      {/* Render bottom sheet using data from useWordDetailsSheet */}
      {selectedWord && (
        <WordDetailsBottomSheet
          ref={bottomSheetRef}
          wordData={selectedWord}
          onDismiss={handleSheetDismiss}
        />
      )}
    </View>
  );
}

// Minimal static styles needed, most are in themeStyles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles for Skeleton Loader
  skeletonOpacity: {
    opacity: 0.3,
  },
  skeletonCard: {
    flex: 1,
    width: '100%',
  },
  skeletonLine1: {
    height: 20,
    width: '50%',
    alignSelf: 'center',
  },
  skeletonLine2: {
    height: 80,
    width: '80%',
    alignSelf: 'center',
  },
  skeletonLine3: {
    height: 40,
    width: '60%',
    alignSelf: 'center',
  },
});
