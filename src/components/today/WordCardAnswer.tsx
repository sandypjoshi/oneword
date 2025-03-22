import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../ui';
import AnimatedChip from '../ui/AnimatedChip';
import { WordOfDay } from '../../types/wordOfDay';
import { radius, applyElevation } from '../../theme/styleUtils';
import Box from '../layout/Box';
import * as Speech from 'expo-speech';

// Maximum time to animate pronunciation button (in ms)
const MAX_SPEAKING_DURATION = 5000;

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
 * Displays the answer card with word, definition, and performance metrics
 */
const WordCardAnswerComponent: React.FC<WordCardAnswerProps> = ({ 
  wordData,
  onViewDetails,
  style 
}) => {
  const { colors, spacing } = useTheme();
  const [speaking, setSpeaking] = useState(false);
  const [speakingDuration, setSpeakingDuration] = useState(3000);
  
  // Destructure the word data
  const { 
    word, 
    definition, 
    pronunciation, 
    partOfSpeech,
    userAttempts = 0,
  } = wordData;
  
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
  
  return (
    <View style={[
      styles.container, 
      {
        backgroundColor: colors.background.card,
        borderColor: colors.border.light,
        borderRadius: radius.xl,
        ...applyElevation('md', colors.text.primary)
      },
      style
    ]}>
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
                { backgroundColor: colors.background.info }
              ]}
              onPress={onViewDetails}
            >
              <Text
                variant="button"
                color={colors.text.info}
                align="center"
                style={{ marginRight: 6 }}
              >
                View Details
              </Text>
              <View style={styles.arrowIcon}>
                {/* Arrow Icon */}
                <View style={[styles.arrow, { borderColor: colors.text.info }]} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Box>
    </View>
  );
};

// Create component styles
const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 380,
    borderWidth: 1,
    overflow: 'hidden',
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  wordText: {
    marginBottom: 8,
  },
  definitionContainer: {
    marginVertical: 16,
  },
  performanceContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  attemptText: {
    marginBottom: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    transform: [{ rotate: '45deg' }],
  }
});

// Use memo to prevent unnecessary re-renders
const WordCardAnswer = React.memo(WordCardAnswerComponent);

export default WordCardAnswer; 