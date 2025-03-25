import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Pressable, useColorScheme, Dimensions } from 'react-native';
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

// Maximum time to animate pronunciation button (in ms)
const MAX_SPEAKING_DURATION = 5000;

// Use exact dimensions from original MeshGradientCard
const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

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
const WordCardAnswer: React.FC<WordCardAnswerProps> = ({ 
  wordData,
  onViewDetails,
  style,
  onFlipBack
}) => {
  const { colors, spacing } = useTheme();
  const deviceColorScheme = useColorScheme();
  const isDark = deviceColorScheme === 'dark';
  
  const [speaking, setSpeaking] = useState(false);
  const [speakingDuration, setSpeakingDuration] = useState(3000);
  
  // Use useRef for mesh data to prevent unnecessary re-renders
  const meshRef = useRef<MeshData | null>(null);
  
  // Use useState for forcing re-renders when mesh changes
  const [meshVersion, setMeshVersion] = useState(0);
  
  // Destructure the word data
  const { 
    word, 
    definition, 
    pronunciation, 
    partOfSpeech,
    userAttempts = 0,
    selectedOption = '',
    example = '',
  } = wordData;
  
  // Generate a consistent seed from the word for same gradient per word
  const wordSeed = useMemo(() => generateSeedFromString(word), [word]);
  
  // Initialize mesh if not already done
  if (!meshRef.current) {
    // Use the utility function to generate the mesh
    meshRef.current = generateMeshGradient({
      width: CARD_WIDTH,
      height: Dimensions.get('window').height,
      isDarkMode: isDark,
      seed: wordSeed
    });
  }
  
  // Memoize border color based on theme
  const borderColor = useMemo(() => 
    getGradientBorderColor(isDark)
  , [isDark]);
  
  // Use useCallback for event handlers to prevent unnecessary recreations
  const handleChangeGradient = useCallback(() => {
    // Regenerate the mesh with the same seed
    meshRef.current = generateMeshGradient({
      width: CARD_WIDTH,
      height: Dimensions.get('window').height,
      isDarkMode: isDark,
      seed: wordSeed
    });
    setMeshVersion(prev => prev + 1); // Force re-render
  }, [isDark, wordSeed]);
  
  // Extract mesh data for rendering
  const mesh = meshRef.current;
  
  // Function to handle pronunciation
  const handlePronunciation = async () => {
    if (!pronunciation || speaking) return;
    
    try {
      setSpeaking(true);
      
      // Calculate an approximate speaking duration based on word length
      const duration = Math.min(MAX_SPEAKING_DURATION, word.length * 250);
      setSpeakingDuration(duration);
      
      await Speech.speak(word, {
        language: 'en',
        onDone: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } catch (error) {
      console.error('Error with pronunciation:', error);
      setSpeaking(false);
    }
  };
  
  // Get attempt message based on user performance
  const getAttemptMessage = () => {
    if (userAttempts === 0) {
      return 'No attempts yet';
    } else if (userAttempts === 1) {
      return 'Correct on first try!';
    } else {
      return `Correct in ${userAttempts} attempts`;
    }
  };
  
  // Get attempt color based on user performance
  const getAttemptColor = () => {
    if (userAttempts === 0) {
      return colors.text.secondary;
    } else if (userAttempts === 1) {
      return colors.text.success;
    } else {
      return colors.text.info;
    }
  };

  // Early return if mesh is not ready
  if (!mesh) return null;

  return (
    <Pressable 
      style={[styles.container, style]}
      onPress={onFlipBack}
    >
      <View style={styles.card}>
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
        <View style={[styles.content, { padding: spacing.lg }]}>
          {/* Word section with part of speech above */}
          <View style={[styles.wordSection, { marginBottom: spacing.md }]}>
            {partOfSpeech && (
              <Text
                variant="caption"
                color={colors.text.secondary}
                style={{ 
                  textAlign: 'center',
                  textTransform: 'lowercase',
                  marginBottom: spacing.xxs * -1,
                }}
              >
                {partOfSpeech}
              </Text>
            )}
            
            <Text 
              variant="serifTextLarge"
              color={colors.text.primary}
              align="center"
              style={[styles.wordText, { marginVertical: spacing.xxs }]}
            >
              {word}
            </Text>
            
            {pronunciation && (
              <AnimatedChip 
                label={pronunciation}
                iconLeft="volumeLoud"
                size="small"
                onPress={handlePronunciation}
                isAnimating={speaking}
                animationDuration={speakingDuration}
                style={[styles.pronunciationChip, { 
                  backgroundColor: colors.background.secondary + '33'
                }]}
              />
            )}
          </View>
          
          {/* Definition section - centered text */}
          <View style={[styles.textSection, { marginBottom: spacing.md }]}>
            <Text
              variant="bodyMedium"
              color={colors.text.primary}
              align="center"
            >
              {definition}
            </Text>
          </View>
          
          {/* Separator line */}
          {example && (
            <View style={[styles.separator, { 
              backgroundColor: colors.border.light,
              marginBottom: spacing.md 
            }]} />
          )}
          
          {/* Example section - styled with highlighted word */}
          {example && (
            <View style={[styles.textSection, { marginBottom: spacing.md }]}>
              <Text
                variant="bodyMedium"
                color={colors.text.primary}
                align="center"
                italic={true}
              >
                {formatExampleWithEmphasis(example, word)}
              </Text>
            </View>
          )}
          
          {/* Action buttons at bottom */}
          <View style={[styles.actionContainer, { marginTop: spacing.md }]}>
            {/* Learn more button */}
            {onViewDetails && (
              <TouchableOpacity 
                style={[
                  styles.learnMoreButton,
                  {
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    backgroundColor: colors.background.tertiary + '1A'
                  }
                ]}
                onPress={onViewDetails}
              >
                <Text
                  variant="button"
                  color={colors.text.secondary}
                  align="center"
                >
                  See more
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

/* Helper function to format example text with the target word emphasized */
const formatExampleWithEmphasis = (example: string, word: string) => {
  // This is a simplistic implementation - a more robust version would use regex with word boundaries
  // and handle case sensitivity better
  const lowerExample = example.toLowerCase();
  const lowerWord = word.toLowerCase();
  
  // If word isn't in example (unlikely), just return the example
  if (!lowerExample.includes(lowerWord)) {
    return example;
  }
  
  // Split the example at the word to create parts
  const parts = [];
  let remaining = example;
  let lowerRemaining = lowerExample;
  let indexOfWord;
  
  while ((indexOfWord = lowerRemaining.indexOf(lowerWord)) !== -1) {
    // Add text before the word
    if (indexOfWord > 0) {
      parts.push(
        <Text key={`pre-${parts.length}`} italic={true}>
          {remaining.substring(0, indexOfWord)}
        </Text>
      );
    }
    
    // Add the word with emphasis
    parts.push(
      <Text key={`word-${parts.length}`} italic={true} style={{fontWeight: '600'}}>
        {remaining.substring(indexOfWord, indexOfWord + word.length)}
      </Text>
    );
    
    // Update remaining text
    remaining = remaining.substring(indexOfWord + word.length);
    lowerRemaining = lowerRemaining.substring(indexOfWord + lowerWord.length);
  }
  
  // Add any remaining text after the last occurrence of the word
  if (remaining.length > 0) {
    parts.push(
      <Text key={`post-${parts.length}`} italic={true}>
        {remaining}
      </Text>
    );
  }
  
  return <>{parts}</>;
};

// Memoize styles to prevent recreation on each render
const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    padding: 0,
  },
  card: {
    width: '100%',
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    height: '100%',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  wordSection: {
    alignItems: 'center',
  },
  wordText: {
  },
  pronunciationChip: {
  },
  textSection: {
    width: '100%',
  },
  sectionTitle: {
  },
  selectedPhrase: {
    borderRadius: radius.md,
  },
  actionContainer: {
    alignItems: 'center',
  },
  learnMoreButton: {
    borderRadius: radius.pill,
  },
  separator: {
    width: '12%',
    height: 1,
  },
});

export default WordCardAnswer; 