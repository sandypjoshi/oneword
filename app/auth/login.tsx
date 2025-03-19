import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from '../../src/components/ui';
import { Box } from '../../src/components/layout';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Box padding="lg" flex={1} align="center" justify="center">
        <Text variant="displayLarge" align="center">Login</Text>
        <Text 
          variant="bodyMedium"
          color={colors.text.secondary}
          align="center"
          style={{ marginBottom: spacing.xl, marginTop: spacing.md }}
        >
          Login to access your personalized word learning experience
        </Text>
        
        <Box marginTop="xl">
          <Button 
            title="Login" 
            onPress={() => router.replace('/(tabs)')}
          />
        </Box>
        
        <Box marginTop="md">
          <Button 
            title="Sign Up" 
            variant="outline"
            onPress={() => router.push('/auth/signup')}
          />
        </Box>
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 