import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  StyleProp, 
  ViewStyle,
  TextStyle
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import Text from './Text';
import Icon from './Icon';

export interface ButtonGroupOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
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
  const { colors } = useTheme();
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
        return styles.horizontalContainer;
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
        backgroundColor: isSelected ? colors.primaryLight : colors.background.card,
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
        {option.icon && (
          <View style={styles.iconContainer}>
            {typeof option.icon === 'string' ? (
              <Icon 
                name={option.icon} 
                size={24} 
                color={isSelected ? colors.primary : colors.text.secondary} 
              />
            ) : (
              option.icon
            )}
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text
            variant="label"
            color={isSelected ? colors.primary : colors.text.primary}
            style={textStyle}
          >
            {option.label}
          </Text>
          
          {option.description && (
            <Text
              variant="bodySmall"
              color={isSelected ? colors.primary : colors.text.secondary}
              style={[{ marginTop: 4 }, textStyle]}
            >
              {option.description}
            </Text>
          )}
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
    gap: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
});

export default ButtonGroup; 