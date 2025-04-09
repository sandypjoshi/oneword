import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import Text from './Text';
import Icon, { IconName } from './Icon';

export interface ButtonGroupOption {
  value: string;
  label: string;
  description?: string;
  icon?: IconName | React.ReactNode;
}

interface ButtonGroupProps {
  options: ButtonGroupOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  variant?: 'vertical' | 'horizontal' | 'grid';
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

/**
 * ButtonGroup component for single or multi-selection
 */
const ButtonGroup: React.FC<ButtonGroupProps> = ({
  options,
  selectedValue,
  onSelect,
  variant = 'vertical',
  containerStyle,
  buttonStyle,
  textStyle,
  disabled = false,
}) => {
  const { colors, spacing } = useTheme();
  const [selected, setSelected] = useState<string | undefined>(selectedValue);

  useEffect(() => {
    setSelected(selectedValue);
  }, [selectedValue]);

  const handleSelect = (value: string) => {
    if (disabled) return;
    setSelected(value);
    onSelect(value);
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'horizontal':
        return [styles.horizontalContainer, { gap: spacing.md }];
      case 'grid':
        return styles.gridContainer;
      default:
        return styles.verticalContainer;
    }
  };

  const getButtonStyle = (isSelected: boolean) => {
    return [
      styles.button,
      {
        borderColor: isSelected ? colors.primary : colors.border.light,
        backgroundColor: isSelected
          ? colors.background.secondary
          : 'transparent',
        borderRadius: spacing.md,
        borderWidth: 2,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md + spacing.xs,
        marginVertical: spacing.sm,
      },
      buttonStyle,
    ];
  };

  const renderButton = (option: ButtonGroupOption) => {
    const isSelected = selected === option.value;

    return (
      <TouchableOpacity
        key={option.value}
        style={getButtonStyle(isSelected)}
        onPress={() => handleSelect(option.value)}
        disabled={disabled}
      >
        <View style={styles.textContainer}>
          <Text
            variant="bodyLarge"
            color={colors.text.primary}
            style={textStyle}
          >
            {option.label}
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Icon
            name={isSelected ? 'checkCircleBold' : 'circleOutline'}
            size={24}
            color={isSelected ? colors.primary : colors.text.secondary}
            variant={isSelected ? 'bold' : 'linear'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {options.map(renderButton)}
    </View>
  );
};

const styles = StyleSheet.create({
  verticalContainer: {
    width: '100%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
});

export default ButtonGroup;
