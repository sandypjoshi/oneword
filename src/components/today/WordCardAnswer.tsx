import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Pressable, useColorScheme, Dimensions, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../ui';
import AnimatedChip from '../ui/AnimatedChip';
import { WordOfDay } from '../../types/wordOfDay';
import { radius } from '../../theme/styleUtils';
import * as Speech from 'expo-speech';
import {
  Canvas,
  Vertices,
  Group,
} from '@shopify/react-native-skia';
import { 
  generateMeshGradient, 
  MeshData, 
  getGradientBorderColor,
  generateSeedFromString
} from '../../utils/meshGradientGenerator';
import { useCardStore } from '../../store/cardStore';
import { useWordStore } from '../../store/wordStore';
import { Box } from '../layout';
import spacing from '../../theme/spacing';

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// This should match the CARD_WIDTH in WordCard.tsx
const CARD_WIDTH = Math.min(SCREEN_WIDTH - (spacing.screenPadding * 2), 400);

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
  onFlipBack?: () => void;
}

/**
 * Displays the answer card with word, definition, and performance metrics
 * Using mesh gradients for beautiful backgrounds
 */
const WordCardAnswerComponent: React.FC<WordCardAnswerProps> = ({ 
  wordData,
  onViewDetails,
  style,
  onFlipBack
}) => {
  const { colors, spacing } = useTheme();
  const deviceColorScheme = useColorScheme();
  const isDark = deviceColorScheme === 'dark';
  
  // Zustand store hooks
  const isWordSpeaking = useCardStore(state => state.isWordSpeaking(wordData.id));
  const speakWord = useCardStore(state => state.speakWord);
  const words = useWordStore(state => state.words);
  
  // Use useRef for mesh data to prevent unnecessary re-renders
  const meshRef = useRef<MeshData | null>(null);
  
  // Use useState for forcing re-renders when mesh changes
  const [meshVersion, setMeshVersion] = useState(0);
  
  // Track container height with state
  const [containerHeight, setContainerHeight] = useState(CARD_WIDTH * 1.4);
  
  // Destructure the word data
  const { 
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
  const wordSeed = useMemo(() => {
    const seed = generateSeedFromString(word);
    console.log(`Generated seed for word "${word}": ${seed}`);
    return seed;
  }, [word]);
  
  // Handle layout change to get actual container height
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== containerHeight) {
      setContainerHeight(height);
    }
  }, [containerHeight]);
  
  // Initialize mesh if not already done
  if (!meshRef.current) {
    console.log(`Initializing mesh for "${word}" with seed ${wordSeed}`);
    meshRef.current = generateMeshGradient({
      width: CARD_WIDTH,
      height: containerHeight,
      isDarkMode: isDark,
      seed: wordSeed
    });
  }
  
  // Regenerate mesh when relevant props change
  useEffect(() => {
    console.log(`Regenerating mesh for "${word}" with seed ${wordSeed}`);
    meshRef.current = generateMeshGradient({
      width: CARD_WIDTH,
      height: containerHeight,
      isDarkMode: isDark,
      seed: wordSeed
    });
    
    setMeshVersion(prev => prev + 1); // Force re-render
  }, [isDark, wordSeed, containerHeight]);
  
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

  // Early return if mesh is not ready
  if (!mesh) return null;

  return (
    <Pressable 
      style={[styles.container, style]}
      onPress={onFlipBack}
      onLayout={handleLayout}
    >
      {/* Canvas for gradient */}
      <Canvas style={styles.canvas}>
        <Group>
          <Vertices
            vertices={mesh.points}
            colors={mesh.colors}
            indices={mesh.indices}
          />
        </Group>
      </Canvas>
      
      {/* Inner border overlay with blend mode */}
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
          
          {pronunciation && (
            <AnimatedChip 
              label={pronunciation}
              iconLeft="volumeLoud"
              size="small"
              onPress={handlePronunciation}
              isAnimating={isWordSpeaking}
              animationDuration={3000} // Default animation duration
              style={[styles.pronunciationChip, { 
                backgroundColor: colors.background.secondary + '33'
              }]}
            />
          )}
        </View>
        
        {/* Definition */}
        <View style={styles.definitionSection}>
          <Text
            variant="bodyMedium"
            color={colors.text.secondary}
            align="center"
            style={{ textTransform: 'lowercase' }}
          >
            {definition}
          </Text>
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
      </Box>
    </Pressable>
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

// Define styles
const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
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
    borderRadius: radius.lg,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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