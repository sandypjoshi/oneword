import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeReady } from '../../src/hooks';
import { Icon } from '../../src/components/ui';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { applyElevation } from '../../src/theme/styleUtils';
import StreakIndicator from '../../src/components/streaks/StreakIndicator';

export default function TabLayout() {
  const { isReady, theme } = useThemeReady();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!isReady) {
    return null;
  }

  const { colors } = theme;

  return (
    <BottomSheetModalProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.text.secondary,
            tabBarStyle: {
              backgroundColor: colors.background.primary,
              borderTopColor: colors.border.light,
            },
            headerStyle: {
              backgroundColor: colors.background.primary,
              borderBottomWidth: 0,
              ...applyElevation('none'),
            },
            headerTintColor: colors.text.primary,

            // Remove fade animation that causes flashing
            animation: 'none',

            // Prevent keyboard issues
            tabBarHideOnKeyboard: true,

            // Properly maintain state between tabs
            freezeOnBlur: true,

            // Prevent tab flicker
            lazy: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={({ route }) => ({
              title: (route.params as { title?: string })?.title || 'Today',
              tabBarLabel: 'Today',
              tabBarIcon: ({ color, focused }) => (
                <Icon
                  name="notes"
                  color={color}
                  size={24}
                  variant={focused ? 'bold' : 'linear'}
                />
              ),
              headerRight: () => <StreakIndicator />,
            })}
          />
          <Tabs.Screen
            name="practice"
            options={{
              title: 'Practice',
              tabBarLabel: 'Practice',
              tabBarIcon: ({ color, focused }) => (
                <Icon
                  name="academicCap"
                  color={color}
                  size={24}
                  variant={focused ? 'bold' : 'linear'}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color, focused }) => (
                <Icon
                  name="user"
                  color={color}
                  size={24}
                  variant={focused ? 'bold' : 'linear'}
                />
              ),
            }}
          />
        </Tabs>
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
