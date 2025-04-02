import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Dimensions, LayoutChangeEvent, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Icon } from '../ui';
import AnimatedChip from '../ui/AnimatedChip';
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
import { useCardStore } from '../../store/cardStore';
import { useWordStore } from '../../store/wordStore';
import { Box } from '../layout';
import spacing from '../../theme/spacing';

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
  const isWordSpeaking = useCardStore(state => state.isWordSpeaking(wordData.id));
  const speakWord = useCardStore(state => state.speakWord);
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
  
  // Function to handle pronunciation
  const handlePronunciation = useCallback(() => {
    if (!pronunciation || isWordSpeaking) return;
    speakWord(wordData.id, word);
  }, [pronunciation, isWordSpeaking, wordData.id, word, speakWord]);
  
  // Get attempt message based on user performance
  const getAttemptMessage = useCallback(() => {
    if (userAttempts === 0) {
      return 'No attempts yet';
    } else if (userAttempts === 1) {
      return 'Correct on first try!';
    } else {
      return `Correct in ${userAttempts} attempts`;
    }
  }, [userAttempts]);
  
  // Get attempt color based on user performance
  const getAttemptColor = useCallback(() => {
    if (userAttempts === 0) {
      return colors.text.secondary;
    } else if (userAttempts === 1) {
      return colors.text.success;
    } else {
      return colors.text.info;
    }
  }, [userAttempts, colors.text]);

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
        {/* Word section with part of speech above */}
        <View style={styles.wordSection}>
          {partOfSpeech && (
            <Text
              variant="caption"
              color={colors.text.secondary}
              italic={true}
              style={{ 
                textAlign: 'center',
                textTransform: 'lowercase',
              }}
            >
              [{partOfSpeech}]
            </Text>
          )}
          
          <Text 
            variant="serifTextLarge"
            color={colors.text.primary}
            align="center"
            style={[styles.wordText]}
          >
            {word}
          </Text>
          
          {/* Wrap pronunciation chip to stop touch propagation */}
          {pronunciation && (
            <View 
              onStartShouldSetResponder={() => true} 
              onTouchEnd={(e: GestureResponderEvent) => e.stopPropagation()}
              // Minimal styling needed, just enough to contain the chip
              style={{ alignSelf: 'center' }} 
            >
              <AnimatedChip 
                label={pronunciation}
                iconLeft="volumeLoud"
                size="small"
                onPress={handlePronunciation} // Chip's onPress remains
                isAnimating={isWordSpeaking}
                variant="onGradient"
                style={styles.pronunciationChip} // Keep internal chip styles
              />
            </View>
          )}
        </View>
        
        {/* Definition */}
        <View style={styles.definitionSection}>
          {Array.isArray(definition) ? (
            // Handle multiple definitions
            definition.map((def, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <View 
                    style={[
                      styles.definitionSeparator,
                      { backgroundColor: colors.text.secondary + '20' }
                    ]} 
                  />
                )}
                <Text
                  variant="bodyMedium"
                  color={colors.text.secondary}
                  align="center"
                  style={{ textTransform: 'lowercase' }}
                >
                  {index + 1}. {def}
                </Text>
              </React.Fragment>
            ))
          ) : (
            // Handle single definition
            <Text
              variant="bodyMedium"
              color={colors.text.secondary}
              align="center"
              style={{ textTransform: 'lowercase' }}
            >
              {definition}
            </Text>
          )}
        </View>
        
        {/* Example sentence with highlighted word */}
        {example && (
          <>
            {/* Separator with inner shadow effect */}
            <View style={styles.separatorContainer}>
              <View style={[styles.hairlineSeparator, { backgroundColor: colors.text.secondary + '40' }]} />
              <View style={[styles.hairlineShadow, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]} />
            </View>
            
            <View style={styles.exampleSection}>
              <Text
                variant="bodyMedium"
                color={colors.text.secondary}
                align="center"
                style={{ fontStyle: 'italic' }}
              >
                {formatExampleText(example, word)}
              </Text>
            </View>
          </>
        )}

        {/* Chip is now "View More" again */}
        {onViewDetails && (
          <View 
            style={{ alignSelf: 'center', marginTop: spacing.lg }} 
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

/* Helper function to format example text with the target word emphasized */
const formatExampleText = (example: string, word: string) => {
  if (!example) return '';
  
  // Case insensitive regex to match the word
  const regex = new RegExp(`\\b(${word})\\b`, 'gi');
  
  // Split the example by the word
  const parts = example.split(regex);
  
  // Join back together with the word wrapped in styled Text
  return parts.map((part, index) => {
    if (part.toLowerCase() === word.toLowerCase()) {
      return <Text 
        key={index} 
        color="secondary" 
        style={{ fontWeight: '500' }}
      >
        {part}
      </Text>;
    }
    return part;
  });
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  wordText: {
    fontWeight: '600',
  },
  pronunciationChip: {
    marginTop: 4,
  },
  definitionSection: {
    marginBottom: 0,
    width: '100%',
  },
  definitionSeparator: {
    height: StyleSheet.hairlineWidth,
    width: '40%',
    alignSelf: 'center',
    marginVertical: spacing.xs,
  },
  exampleSection: {
    marginBottom: 0,
  },
  separatorContainer: {
    width: '80%',
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    position: 'relative',
    height: 2,
  },
  hairlineSeparator: {
    height: 1,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  hairlineShadow: {
    height: 1,
    width: '100%',
    position: 'absolute',
    top: 1,
  },
});

// Apply memo to the component
const WordCardAnswer = memo(WordCardAnswerComponent);

// Set display name for better debugging
WordCardAnswer.displayName = 'WordCardAnswer';

export default WordCardAnswer; 