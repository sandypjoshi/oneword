import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { useThemeReady } from '../../src/hooks';
import { Icon } from '../../src/components/ui';

export default function TabLayout() {
  const { isReady, theme } = useThemeReady();
  const { animation } = useLocalSearchParams();
  
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
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name="notes" 
              color={color} 
              size={24} 
              variant={focused ? 'bold' : 'linear'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Challenges',
          tabBarLabel: 'Challenges',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name="medalRibbon" 
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
  );
} 