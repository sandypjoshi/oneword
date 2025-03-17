import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  ViewToken 
} from 'react-native';
import { DateItem } from '../../types/wordOfDay';
import { useTheme } from '../../theme/ThemeProvider';

interface DateSelectorProps {
  /**
   * Number of days to display in the selector (including today)
   * Default: 14 (2 weeks)
   */
  daysToShow?: number;
  
  /**
   * Function called when a date is selected
   */
  onDateSelected: (date: string) => void;
  
  /**
   * Currently selected date in ISO format (YYYY-MM-DD)
   */
  selectedDate: string;
}

// Width of a date item in the selector
const ITEM_WIDTH = 60;

/**
 * A horizontal date selector showing days in the past with today as the rightmost item
 */
const DateSelector: React.FC<DateSelectorProps> = ({ 
  daysToShow = 14,
  onDateSelected,
  selectedDate 
}) => {
  const { colors, spacing } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [dateItems, setDateItems] = useState<DateItem[]>([]);
  
  // Generate date items whenever daysToShow or selectedDate changes
  useEffect(() => {
    const dates: DateItem[] = [];
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Generate dates for the past N days (including today)
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      const day = date.getDate().toString();
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
      const dateString = date.toISOString().split('T')[0];
      
      dates.push({
        date,
        formatted: {
          day,
          weekday
        },
        isToday: dateString === todayString,
        isSelected: dateString === selectedDate
      });
    }
    
    setDateItems(dates);
  }, [daysToShow, selectedDate]);
  
  // Scroll to the selected item
  useEffect(() => {
    if (flatListRef.current && dateItems.length > 0) {
      const selectedIndex = dateItems.findIndex(item => 
        item.date.toISOString().split('T')[0] === selectedDate
      );
      
      if (selectedIndex !== -1) {
        // Center the selected date when possible
        const screenWidth = Dimensions.get('window').width;
        const centerOffset = screenWidth / 2 - ITEM_WIDTH / 2;
        
        flatListRef.current.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewOffset: centerOffset,
          viewPosition: 0.5
        });
      }
    }
  }, [selectedDate, dateItems]);
  
  // Handle date selection
  const handleSelectDate = useCallback((dateString: string) => {
    onDateSelected(dateString);
  }, [onDateSelected]);
  
  // Render a date item
  const renderDateItem = useCallback(({ item }: { item: DateItem }) => {
    const { date, formatted, isToday, isSelected } = item;
    const dateString = date.toISOString().split('T')[0];
    
    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          { width: ITEM_WIDTH, marginHorizontal: spacing.xs }
        ]}
        onPress={() => handleSelectDate(dateString)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.dateContent,
            isSelected && { 
              backgroundColor: colors.primary,
              borderColor: colors.primary 
            }
          ]}
        >
          <Text 
            style={[
              styles.weekdayText,
              { color: isSelected ? colors.text.inverse : colors.text.secondary }
            ]}
          >
            {formatted.weekday}
          </Text>
          <Text 
            style={[
              styles.dayText,
              { color: isSelected ? colors.text.inverse : colors.text.primary }
            ]}
          >
            {formatted.day}
          </Text>
          {isToday && !isSelected && (
            <View 
              style={[
                styles.todayIndicator, 
                { backgroundColor: colors.primary }
              ]} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [colors, handleSelectDate, spacing.xs]);
  
  // Handle scroll end to ensure a date is centered
  const handleViewableItemsChanged = useCallback(({ 
    viewableItems 
  }: {
    viewableItems: ViewToken[];
  }) => {
    // Optional: When a date becomes visible, we could do something
  }, []);
  
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dateItems}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.date.toISOString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        initialNumToRender={daysToShow}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + spacing.xs * 2,
          offset: (ITEM_WIDTH + spacing.xs * 2) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dateItem: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContent: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
  },
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 6,
  },
});

export default DateSelector; 