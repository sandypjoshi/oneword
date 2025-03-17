import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { useThemeReady } from '../../src/hooks';
import { Icon } from '../../src/components/ui';

export default function TabLayout() {
  const { isReady, theme } = useThemeReady();
  
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  const { colors } = theme;
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
        },
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarLabel: 'Today',
          tabBarIcon: ({ color }) => (
            <Icon name="calendar" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarLabel: 'Practice',
          tabBarIcon: ({ color }) => (
            <Icon name="book" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Icon name="user" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
} 