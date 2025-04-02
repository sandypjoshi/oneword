import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme';
import Box from '../layout/Box';
import Text from '../ui/Text';
import Icon, { IconName } from '../ui/Icon';
import Chip from '../ui/Chip';
import { useCardStore, OptionState } from '../../store/cardStore';
import { radius } from '../../theme/styleUtils';
import WordSection from './WordSection';

interface ReflectionCardProps {
  wordData: WordOfDay;
  style?: StyleProp<ViewStyle>;
  onNavigateToAnswer?: () => void;
  onFlipBack?: () => void;
}

const ReflectionCardComponent: React.FC<ReflectionCardProps> = ({
  wordData,
  style,
  onNavigateToAnswer,
  onFlipBack,
}) => {
  const { colors, spacing, effectiveColorMode } = useTheme();
  const { id, word, definition, pronunciation, partOfSpeech, options = [] } = wordData;

  const getOptionState = useCardStore(state => state.getOptionState);
  const selectedOptionValue = useCardStore(state => state.getSelectedOption(id));
  const attempts = useCardStore(state => state.getAttempts(id));
  console.log(`[ReflectionCard] Word ID: ${id}, Attempts from store: ${attempts}`);

  // --- Define Copy Pools with Emojis ---
  const firstTryCopy = useMemo(() => [
    "First guess! 🎉",
    "Nailed it first try! ✨",
    "Spot on! ✅",
    "Got it in one! 👍",
  ], []);

  const multiTryCopyTemplates = useMemo(() => [
    (count: number) => `Guessed it in ${count}! 👍`, 
    (count: number) => `Took ${count} guesses, but you got it! 🎉`,
    (count: number) => `Solved in ${count} tries. 🙂`,
    (count: number) => `${count} guesses to find it! ✨`,
  ], []);

  const fallbackCopy = useMemo(() => [
    "Guess Review 🤔",
    "Answer Breakdown 👀",
    "How Your Guess Went 👇",
    "The Reveal ✨",
  ], []);

  // --- Select Random Copy Memoized ---
  const reviewText = useMemo(() => {
    console.log(`[ReflectionCard] Calculating reviewText for attempts: ${attempts}`);
    if (attempts === undefined) {
      const randomIndex = Math.floor(Math.random() * fallbackCopy.length);
      return fallbackCopy[randomIndex];
    } else if (attempts === 1) {
      const randomIndex = Math.floor(Math.random() * firstTryCopy.length);
      return firstTryCopy[randomIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * multiTryCopyTemplates.length);
      const template = multiTryCopyTemplates[randomIndex];
      return template(attempts);
    }
  }, [attempts, firstTryCopy, multiTryCopyTemplates, fallbackCopy]);

  const correctOptionValue = options.find(o => o.isCorrect)?.value;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: radius.xl,
      borderWidth: 1,
    },
    contentContainer: {
      flex: 1,
      width: '100%',
      paddingTop: spacing.xl,
    },
    wordSection: {
      marginBottom: spacing.lg,
    },
    optionsSection: {
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      justifyContent: 'center',
      width: '100%',
    },
    divider: {
      height: 1,
      width: '100%',
    },
  }), [spacing]);

  const renderOptionStatus = (option: WordOption) => {
    const state = getOptionState(id, option.value);
    const isCorrect = option.isCorrect;

    let iconName: IconName | null = null;
    let iconColor = colors.text.secondary;
    let textColor = colors.text.secondary;
    let fontWeightStyle: { fontWeight: 'bold' | 'normal' } = { fontWeight: 'normal' };

    if (isCorrect) {
      iconName = 'checkmark'; 
      iconColor = colors.success;
      textColor = colors.text.primary;
      fontWeightStyle = { fontWeight: 'bold' };
    } else if (state === 'incorrect') {
      iconName = 'close';
      iconColor = colors.error;
      textColor = colors.text.tertiary;
    } else {
      iconName = 'close';
      iconColor = colors.text.disabled;
      textColor = colors.text.tertiary;
    }

    return (
      <View key={option.value} style={styles.optionRow}>
        <View style={{ width: 18 + spacing.sm, alignItems: 'center' }}>
          {iconName && (
            <Icon 
              name={iconName} 
              size={18} 
              color={iconColor}
              variant="bold"
            />
          )}
        </View>
        <Text 
          variant="bodyMedium" 
          color={textColor} 
          style={[{ flexShrink: 1, marginLeft: spacing.sm }, fontWeightStyle]}
          textTransform="lowercase"
        >
          {option.value}
        </Text>
      </View>
    );
  };

  const isDark = effectiveColorMode === 'dark';
  const chipBaseBackgroundColor = isDark ? colors.background.primary : colors.background.card;

  return (
    <TouchableOpacity
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background.card,
          borderColor: colors.border.light
        },
        style
      ]}
      onPress={onFlipBack}
      disabled={!onFlipBack}
      activeOpacity={0.9}
    >
      <Box padding="lg" style={styles.contentContainer}>
        <WordSection 
          wordId={id}
          word={word}
          pronunciation={pronunciation}
          partOfSpeech={partOfSpeech}
          style={styles.wordSection}
        />

        <View style={[styles.divider, { backgroundColor: colors.border.light }]} />

        <View style={styles.optionsSection}>
          <Text variant="label" color={colors.text.tertiary} style={{ marginBottom: spacing.md, textAlign: 'center', width: '100%' }}>
            {reviewText}
          </Text>
          {options.map(renderOptionStatus)}
        </View>
      </Box>
    </TouchableOpacity>
  );
};

const ReflectionCard = React.memo(ReflectionCardComponent);
ReflectionCard.displayName = 'ReflectionCard';

export default ReflectionCard; 