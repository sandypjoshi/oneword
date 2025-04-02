import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme';
import Box from '../layout/Box';
import Text from '../ui/Text';
import Icon from '../ui/Icon';
import Chip from '../ui/Chip';
import { useCardStore, OptionState } from '../../store/cardStore';
import { radius } from '../../theme/styleUtils';

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
  const { colors, spacing } = useTheme();
  const { id, word, definition, pronunciation, options = [] } = wordData;

  const getOptionState = useCardStore(state => state.getOptionState);
  const selectedOptionValue = useCardStore(state => state.getSelectedOption(id));

  const correctOptionValue = options.find(o => o.isCorrect)?.value;

  const renderOptionStatus = (option: WordOption) => {
    const state = getOptionState(id, option.value);
    const isSelected = option.value === selectedOptionValue;
    const isCorrect = option.value === correctOptionValue;

    let iconName: React.ComponentProps<typeof Icon>['name'] | null = null;
    let iconColor = colors.text.secondary;
    let textColor = colors.text.secondary;
    let fontWeightStyle: { fontWeight: 'bold' | 'normal' } = { fontWeight: 'normal' };

    if (isCorrect) {
      iconName = 'checkmark'; 
      iconColor = colors.success;
      textColor = colors.text.primary;
      fontWeightStyle = { fontWeight: 'bold' };
    } else if (isSelected && state === 'incorrect') {
      iconName = 'close';
      iconColor = colors.error;
      textColor = colors.text.error;
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
          style={[{ flexShrink: 1, marginLeft: spacing.xs }, fontWeightStyle]}
        >
          {option.value}
        </Text>
      </View>
    );
  };

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
        <View style={styles.wordInfoSection}>
          <Text variant="headingSmall" color={colors.text.primary}>{word}</Text>
          {pronunciation && (
            <Text variant="bodyMedium" color={colors.text.secondary} style={{ marginTop: spacing.xxs }}>
              [{pronunciation}]
            </Text>
          )}
          <Text variant="bodyMedium" color={colors.text.secondary} style={{ marginTop: spacing.sm }}>
            {definition}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border.light }]} />

        <View style={styles.optionsSection}>
          <Text variant="label" color={colors.text.tertiary} style={{ marginBottom: spacing.md }}>
            Your Answer Review:
          </Text>
          {options.map(renderOptionStatus)}
        </View>

        {onNavigateToAnswer && (
          <View 
            style={{ alignSelf: 'center', marginTop: spacing.xl }} 
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Chip
              label="View Answer"
              size="small"
              variant="default"
              onPress={onNavigateToAnswer}
            />
          </View>
        )}
      </Box>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  wordInfoSection: {
    marginBottom: 16,
  },
  optionsSection: {
    marginTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    width: '100%',
  },
});

const ReflectionCard = React.memo(ReflectionCardComponent);
ReflectionCard.displayName = 'ReflectionCard';

export default ReflectionCard; 