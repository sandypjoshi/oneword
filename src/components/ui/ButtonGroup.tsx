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
  selectedValues: string | string[];
  onChange: (value: string | string[]) => void;
  mode?: 'single' | 'multiple';
  layout?: 'horizontal' | 'vertical' | 'grid';
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * ButtonGroup component for single or multi-selection
 */
const ButtonGroup: React.FC<ButtonGroupProps> = ({
  options,
  selectedValues,
  onChange,
  mode = 'single',
  layout = 'vertical',
  buttonStyle,
  textStyle,
  containerStyle,
}) => {
  const { colors, spacing } = useTheme();
  const [internalSelected, setInternalSelected] = useState<string[]>(
    Array.isArray(selectedValues) ? selectedValues : [selectedValues]
  );

  // Update internal state when prop changes
  useEffect(() => {
    setInternalSelected(Array.isArray(selectedValues) ? selectedValues : [selectedValues]);
  }, [selectedValues]);

  const handleSelect = (value: string) => {
    let newSelected: string[];
    
    if (mode === 'single') {
      newSelected = [value];
    } else {
      if (internalSelected.includes(value)) {
        newSelected = internalSelected.filter(v => v !== value);
      } else {
        newSelected = [...internalSelected, value];
      }
    }
    
    setInternalSelected(newSelected);
    onChange(mode === 'single' ? newSelected[0] : newSelected);
  };

  const isSelected = (value: string) => internalSelected.includes(value);
  
  // Determine layout container style
  const getContainerStyle = () => {
    switch (layout) {
      case 'horizontal':
        return styles.horizontalContainer;
      case 'grid':
        return styles.gridContainer;
      default:
        return styles.verticalContainer;
    }
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {options.map((option, index) => {
        const selected = isSelected(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.button,
              {
                backgroundColor: 'transparent',
                borderColor: selected ? colors.primary : colors.border.medium,
                borderWidth: selected ? 2.5 : 1.5,
                ...(layout === 'vertical' ? { width: '100%' } : {}),
                ...(layout === 'grid' ? { width: '48%' } : {}),
              },
              buttonStyle
            ]}
            activeOpacity={0.7}
            onPress={() => handleSelect(option.value)}
            accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
            accessibilityState={{ checked: selected }}
          >
            <View style={styles.iconContainer}>
              {selected ? (
                <Icon 
                  name="checkCircleBold" 
                  size={22} 
                  color={colors.primary}
                />
              ) : (
                <Icon 
                  name="circleOutline" 
                  size={22} 
                  color={colors.text.secondary}
                />
              )}
            </View>
            
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text.primary },
                  textStyle
                ]}
              >
                {option.label}
              </Text>
              
              {option.description && (
                <Text
                  style={[
                    styles.description,
                    { color: colors.text.secondary },
                  ]}
                  numberOfLines={2}
                >
                  {option.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
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
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default ButtonGroup; 