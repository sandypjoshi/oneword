import React, { memo, useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { WordOfDay } from '../../types/wordOfDay';
import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../layout';
import { Text, Icon } from '../ui';
import { radius, elevation } from '../../theme/styleUtils';
import AnimatedChip from '../ui/AnimatedChip';
import { speak, isSpeaking } from '../../utils/tts';

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
}

/**
 * Card component that displays a word with its definition
 * and user attempt information
 */
const WordCardAnswerComponent: React.FC<WordCardAnswerProps> = ({ 
  wordData,
  onViewDetails,
  style 
}) => {
  const { colors, spacing } = useTheme();
  const { 
    word, 
    pronunciation, 
    partOfSpeech, 
    definition,
    userAttempts = 0
  } = wordData;
  
  const [speaking, setSpeaking] = useState(false);
  const [speakingDuration, setSpeakingDuration] = useState(1500);
  
  // Handle pronounciation
  const handlePronunciation = async () => {
    const duration = await speak(word);
    setSpeakingDuration(duration);
    setSpeaking(true);
  };
  
  // Check speaking state
  useEffect(() => {
    if (speaking) {
      const checkInterval = setInterval(() => {
        if (!isSpeaking()) {
          setSpeaking(false);
          clearInterval(checkInterval);
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }
  }, [speaking]);
  
  // Format attempt message
  const getAttemptMessage = () => {
    if (userAttempts === 0) {
      return 'Not attempted yet';
    } else if (userAttempts === 1) {
      return 'Correct on first attempt!';
    } else {
      return `Correct on attempt #${userAttempts}`;
    }
  };
  
  // Get attempt color
  const getAttemptColor = () => {
    if (userAttempts === 0) {
      return colors.text.secondary;
    } else if (userAttempts === 1) {
      return colors.success;
    } else {
      return colors.primary;
    }
  };
  
  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: colors.background.card,
          borderColor: colors.border.light,
          borderRadius: radius.xl,
        },
        style
      ]}
    >
      <Box padding="lg" style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Word section */}
        <View style={styles.wordSection}>
          {partOfSpeech && (
            <Text
              variant="caption"
              color={colors.text.secondary}
              italic={true}
              weight="bold"
              style={{ 
                textAlign: 'center',
                textTransform: 'lowercase',
                marginBottom: -4
              }}
            >
              {partOfSpeech}
            </Text>
          )}
          
          <Text 
            variant="serifTextLarge"
            color={colors.text.primary}
            align="center"
            style={[styles.wordText, { marginTop: -2 }]}
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
            />
          )}
        </View>
        
        {/* Definition section */}
        <View style={styles.definitionContainer}>
          <Text
            variant="bodyLarge"
            color={colors.text.primary}
            align="center"
          >
            {definition}
          </Text>
        </View>
        
        {/* User performance section */}
        <View style={styles.performanceContainer}>
          <Text
            variant="bodyMedium"
            color={getAttemptColor()}
            align="center"
            style={styles.attemptText}
          >
            {getAttemptMessage()}
          </Text>
          
          {onViewDetails && (
            <TouchableOpacity 
              style={[
                styles.detailsButton,
                { backgroundColor: colors.primary + '15' }
              ]}
              onPress={onViewDetails}
            >
              <Text
                variant="button"
                color={colors.primary}
                align="center"
                style={{ marginRight: 6 }}
              >
                View Details
              </Text>
              <Icon 
                name="altArrowRightLinear" 
                size={16} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </Box>
    </View>
  );
};

// Apply memo to prevent unnecessary re-renders
const WordCardAnswer = memo(WordCardAnswerComponent);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    ...elevation.sm,
    overflow: 'hidden',
    flex: 1,
    display: 'flex',
  },
  wordSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  wordText: {
    textTransform: 'lowercase',
    marginBottom: 8
  },
  pronunciationText: {
    marginTop: 4,
  },
  partOfSpeechText: {
    textTransform: 'lowercase',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center'
  },
  definitionContainer: {
    paddingVertical: 24,
  },
  performanceContainer: {
    alignItems: 'center',
  },
  attemptText: {
    marginBottom: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
  }
});

// Set display name for better debugging
WordCardAnswer.displayName = 'WordCardAnswer';

export default WordCardAnswer; 