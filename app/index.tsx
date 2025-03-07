import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Button, Card } from '../components/common';
import { Text } from '../src/theme/Text';
import { Box } from '../src/theme/Box';
import { useTheme } from '../src/theme/ThemeProvider';

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  
  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      style={{ backgroundColor: colors.background.primary }}
    >
      <Box padding="lg">
        <Text variant="h1" align="center">Welcome to OneWord</Text>
        <Text 
          variant="h3" 
          color={colors.text.secondary}
          align="center"
          style={{ marginBottom: spacing.xl }}
        >
          Your app has been reset
        </Text>
        
        <Card style={styles.card}>
          <Text variant="h4">Basic Components</Text>
          <Text variant="body1" style={{ marginVertical: spacing.sm }}>
            This app now uses a clean theme system with React Native components.
            You can build your UI using these themed components.
          </Text>
          <Box marginTop="md">
            <Button title="Primary Button" />
          </Box>
        </Card>
        
        <Card variant="outlined" style={styles.card}>
          <Text variant="h4">Theme System</Text>
          <Text variant="body1" style={{ marginVertical: spacing.sm }}>
            The app automatically adapts to light and dark mode using React Context.
            You can access theme values via the useTheme hook.
          </Text>
          <Box marginTop="md">
            <Button title="Secondary Button" variant="secondary" />
          </Box>
        </Card>
        
        <Card variant="filled" style={styles.card}>
          <Text variant="h4">Next Steps</Text>
          <Text variant="body1" style={{ marginVertical: spacing.sm }}>
            Customize the theme, add navigation, and implement your app's features.
          </Text>
          <Box marginTop="md">
            <Button title="Outline Button" variant="outline" />
          </Box>
        </Card>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  card: {
    width: '100%',
    marginBottom: 20,
  },
}); 