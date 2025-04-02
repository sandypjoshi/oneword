import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import AnimatedChip from '../ui/AnimatedChip';
import { useCardStore } from '../../store/cardStore';

interface WordSectionProps {
  wordId: string;
  word: string;
  pronunciation?: string | null;
  partOfSpeech?: string | null;
  style?: StyleProp<ViewStyle>;
}

const WordSectionComponent: React.FC<WordSectionProps> = ({
  wordId,
  word,
  pronunciation,
  partOfSpeech,
  style,
}) => {
  const { colors, spacing } = useTheme();

  // Hooks and handler for pronunciation
  const isWordSpeaking = useCardStore(state => state.isWordSpeaking(wordId));
  const speakWord = useCardStore(state => state.speakWord);

  const handlePronunciation = useCallback(() => {
    if (!isWordSpeaking && pronunciation) {
      speakWord(wordId, word);
    }
  }, [wordId, word, pronunciation, isWordSpeaking, speakWord]);

  // Define styles inside component with useMemo
  const styles = useMemo(() => StyleSheet.create({
    wordSectionContainer: {
      alignItems: 'center',
    },
    partOfSpeechText: {
      textAlign: 'center',
      textTransform: 'lowercase',
      marginBottom: -4,
    },
    wordText: {
      textTransform: 'lowercase', 
      marginTop: -2,
      marginBottom: spacing.sm, 
    },
    pronunciationChip: {
      marginTop: spacing.xs,
    },
  }), [spacing]);

  return (
    <View style={[styles.wordSectionContainer, style]}>
      {partOfSpeech && (
        <Text
          variant="caption"
          color={colors.text.secondary}
          italic={true}
          style={styles.partOfSpeechText}
        >
          [{partOfSpeech}]
        </Text>
      )}
      
      <Text 
        variant="serifTextLarge"
        color={colors.text.primary}
        align="center"
        style={styles.wordText}
      >
        {word}
      </Text>
      
      {pronunciation && (
        // Wrap chip for propagation stop if needed? No, this component won't be tapped directly.
        <AnimatedChip 
          label={pronunciation}
          iconLeft="volumeLoud"
          size="small"
          onPress={handlePronunciation}
          isAnimating={isWordSpeaking}
          // Define standard variant or pass via props if needed
          variant="default" // Or maybe "onGradient" if always used on gradient?
                           // Let's start with default, can be overridden via style prop if needed.
          style={styles.pronunciationChip} // Style for positioning
        />
      )}
    </View>
  );
};

const WordSection = memo(WordSectionComponent);
WordSection.displayName = 'WordSection';

export default WordSection; 