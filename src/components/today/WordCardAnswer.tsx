import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Dimensions, LayoutChangeEvent, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Icon } from '../ui';
import Chip from '../ui/Chip';
import { WordOfDay } from '../../types/wordOfDay';
import { radius as themeRadiusTokens } from '../../theme/styleUtils';
import * as Speech from 'expo-speech';
import {
  Canvas,
  Vertices,
  Group,
  SweepGradient,
  Skia,
  LinearGradient,
  Shadow
} from '@shopify/react-native-skia';
import { 
  MeshData, 
  getGradientBorderColor,
  getOrGenerateMesh,
  shouldRegenerateMesh
} from '../../utils/meshGradientGenerator';
import { useWordStore } from '../../store/wordStore';
import { Box } from '../layout';
import spacing from '../../theme/spacing';
import WordSection from './WordSection';

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// This should match the CARD_WIDTH in WordCard.tsx
const CARD_WIDTH = Math.min(SCREEN_WIDTH - (spacing.screenPadding * 2), 400);
// Define card height for consistent gradient rendering
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.7, 700); // 70% of screen height, max 700px

interface WordCardAnswerProps {
  /**
   * Word data to display
   */
  wordData: WordOfDay;
  
  /**
   * Function called when the details button is pressed
   */
  onViewDetails?: () => void;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Function called when card is tapped to flip back
   */
  onNavigateToReflection?: () => void;
}

/**
 * Displays the answer card with word, definition, and performance metrics
 * Using mesh gradients for beautiful backgrounds
 */
const WordCardAnswerComponent: React.FC<WordCardAnswerProps> = ({ 
  wordData,
  onViewDetails,
  style,
  onNavigateToReflection
}) => {
  const { colors, spacing, effectiveColorMode } = useTheme();
  
  // Use the centralized effectiveColorMode
  const isDark = effectiveColorMode === 'dark';
  
  // Zustand store hooks
  const words = useWordStore(state => state.words);
  
  // Use useRef for mesh data and theme version tracking
  const meshRef = useRef<MeshData | null>(null);
  const themeVersionRef = useRef<number>(1);
  
  // Use useState for forcing re-renders when mesh changes
  const [meshVersion, setMeshVersion] = useState(0);
  
  // Track container height with state
  const [containerHeight, setContainerHeight] = useState(CARD_WIDTH * 1.4);
  
  // Destructure the word data
  const { 
    id,
    word, 
    definition, 
    pronunciation, 
    partOfSpeech,
    example = '',
  } = wordData;
  
  // Find the word in the store to get updated stats
  const storeWord = useMemo(() => 
    words.find(w => w.id === wordData.id), 
  [words, wordData.id]);
  
  // Get user attempts from store or fallback to wordData
  const userAttempts = storeWord?.userAttempts || wordData.userAttempts || 0;
  
  // Generate a consistent seed from the word for same gradient per word
  const wordSeed = useMemo(() => 
    Date.parse(wordData.date || new Date().toISOString())
  , [wordData.date]);
  
  // Handle layout change to get actual container height
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== containerHeight) {
      setContainerHeight(height);
    }
  }, [containerHeight]);
  
  // Initialize or update mesh with proper theme change detection
  useEffect(() => {
    // Check if we need to regenerate due to theme changes
    const shouldRegenerate = shouldRegenerateMesh(themeVersionRef.current);
    
    // Use either the measured height or the defined CARD_HEIGHT, whichever is larger
    const meshHeight = Math.max(containerHeight, CARD_HEIGHT);
    
    if (shouldRegenerate || !meshRef.current) {
      // Use getOrGenerateMesh which handles caching
      meshRef.current = getOrGenerateMesh(id, {
        width: CARD_WIDTH,
        height: meshHeight,
        isDarkMode: isDark,
        seed: wordSeed
      });
      
      // Update theme version to track regeneration
      themeVersionRef.current = Date.now();
      setMeshVersion(prev => prev + 1); // Force re-render
    }
  }, [id, isDark, wordSeed, containerHeight]);
  
  // Memoize border color based on theme
  const borderColor = useMemo(() => 
    getGradientBorderColor(isDark)
  , [isDark]);
  
  // Extract mesh data for rendering
  const mesh = meshRef.current;
  
  // Determine the base background color for the chip based on the theme mode
  const chipBaseBackgroundColor = isDark ? colors.background.primary : colors.background.card;

  // Early return if mesh is not ready
  if (!mesh) return null;

  return (
    // TouchableOpacity triggers onNavigateToReflection
    <TouchableOpacity
      activeOpacity={0.9} 
      onPress={onNavigateToReflection} 
      disabled={!onNavigateToReflection}
      style={[
        styles.container, 
        style
      ]}
      onLayout={handleLayout} // Keep onLayout
    >
      {/* Canvas for gradient - Keep pointerEvents="none" */}
      <Canvas style={styles.canvas} pointerEvents="none">
        <Group>
          <Vertices
            vertices={mesh.points}
            colors={mesh.colors}
            indices={mesh.indices}
          />
        </Group>
      </Canvas>
      
      {/* Inner border overlay */}
      <View style={[
        styles.innerBorder, 
        { borderColor }
      ]} />
      
      {/* Content - Word answer and details */}
      <Box padding="md" style={styles.content}>
        {/* Use WordSection, specify onGradient variant */}
        <WordSection
          wordId={id}
          word={word}
          pronunciation={pronunciation}
          partOfSpeech={partOfSpeech}
          style={styles.wordSection} 
          chipVariant="onGradient" // Specify variant for gradient background
        />
        
        {/* Definition */}
        {definition && (
          <Text
            variant="bodySmall"
            color={colors.text.secondary}
            style={styles.definitionText}
            textTransform="lowercase"
          >
            {definition}
          </Text>
        )}
        
        {/* Example sentence with highlighted word */}
        {example && (
          <Text 
            variant="bodyMedium"
            color={colors.text.secondary}
            align="center"
            style={[styles.exampleText, { fontStyle: 'italic' }]}
          >
            {example}
          </Text>
        )}

        {/* Chip is now "View More" again */}
        {onViewDetails && (
          <View 
            style={styles.chipWrapper}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Chip
              label="View More"
              iconRight="altArrowRightLinear" 
              size="small"
              variant="default" 
              onPress={onViewDetails}
              style={{ paddingRight: spacing.sm }} 
              backgroundColor={chipBaseBackgroundColor + 'B3'}
              internalSpacing="xs" 
            />
          </View>
        )}
      </Box>

    </TouchableOpacity> // Close the TouchableOpacity wrapper
  );
};

// Define static styles that don't depend on theme variables here
const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: themeRadiusTokens.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: themeRadiusTokens.lg,
    // borderColor is applied dynamically
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg, 
  },
  wordSection: {
    marginBottom: spacing.md,
  },
  definitionText: {
    marginTop: spacing.xs,
  },
  exampleText: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  chipWrapper: {
    alignSelf: 'center',
    marginTop: spacing.lg, 
  },
});

// Apply memo to the component
const WordCardAnswer = memo(WordCardAnswerComponent);

// Set display name for better debugging
WordCardAnswer.displayName = 'WordCardAnswer';

export default WordCardAnswer; 