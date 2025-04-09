import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import AnimatedChip from '../ui/AnimatedChip';
import { useWordCardStore } from '../../store/wordCardStore';
import { FONT_SIZES, LINE_HEIGHTS } from '../../theme/typography';

// Define the type locally
type AnimatedChipVariant = 'default' | 'onGradient';

interface WordSectionProps {
  wordId: string;
  word: string;
  pronunciation?: string | null;
  partOfSpeech?: string | null;
  style?: StyleProp<ViewStyle>;
  chipVariant?: AnimatedChipVariant;
}

const WordSectionComponent: React.FC<WordSectionProps> = ({
  wordId,
  word,
  pronunciation,
  partOfSpeech,
  style,
  chipVariant = 'default',
}) => {
  const { colors, spacing } = useTheme();

  // Hooks and handler for pronunciation using wordCardStore
  const isWordSpeaking = useWordCardStore(state => state.isWordSpeaking(wordId));
  const speakWord = useWordCardStore(state => state.speakWord);

  const handlePronunciation = useCallback(() => {
    if (!isWordSpeaking && pronunciation) {
      speakWord(wordId, word);
    }
  }, [wordId, word, pronunciation, isWordSpeaking, speakWord]);

  // Define styles inside component with useMemo
  const styles = useMemo(() => {
    return StyleSheet.create({
      wordSectionContainer: {
        width: '100%',
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
    });
  }, [spacing]);

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
        adjustsFontSizeToFit={true}
        numberOfLines={1}
        minimumFontScale={0.85}
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
          variant={chipVariant}
          style={styles.pronunciationChip}
        />
      )}
    </View>
  );
};

const WordSection = memo(WordSectionComponent);
WordSection.displayName = 'WordSection';

export default WordSection; 