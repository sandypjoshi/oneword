import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from '../../src/components/ui';
import { Box } from '../../src/components/layout';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Box padding="lg" flex={1} align="center" justify="center">
        <Text variant="h2">Modal</Text>
        <Text 
          variant="body1" 
          color={colors.text.secondary}
          align="center"
          style={styles.subtitle}
        >
          This is a modal screen example
        </Text>
        
        <Box marginTop="xl">
          <Button 
            title="Close" 
            onPress={() => router.back()}
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
  subtitle: {
    marginTop: 8,
  },
}); 