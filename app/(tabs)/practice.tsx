import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';
import { MeshGradient } from '../../src/components/common';
import { getGradientIds } from '../../src/theme/primitives/gradients';

export default function PracticeScreen() {
  const { isReady, theme } = useThemeReady();
  const [gradientId, setGradientId] = useState<string | null>(null);
  const [seed, setSeed] = useState(12345);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { colors } = theme;
  const gradientIds = getGradientIds('light');
  
  // Get a random gradient ID if none is selected
  if (!gradientId && gradientIds.length > 0) {
    setGradientId(gradientIds[Math.floor(Math.random() * gradientIds.length)]);
  }
  
  const handleGradientChange = () => {
    // Cycle to the next gradient
    const currentIndex = gradientIds.indexOf(gradientId || '');
    const nextIndex = (currentIndex + 1) % gradientIds.length;
    setGradientId(gradientIds[nextIndex]);
  };
  
  const handlePatternChange = () => {
    // Generate a new seed for a different pattern
    setSeed(Math.floor(Math.random() * 100000));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Box padding="lg" flex={1} align="center" justify="center">
        <Text variant="headingMedium" style={{ marginBottom: 24 }}>Practice</Text>
        
        <View style={styles.cardContainer}>
          {/* TouchableOpacity makes the entire card clickable */}
          <TouchableOpacity 
            style={styles.card}
            onPress={handleGradientChange} 
            onLongPress={handlePatternChange}
            delayLongPress={300}
            activeOpacity={0.9}
          >
            {/* MeshGradient provides the background */}
            <MeshGradient 
              gradientId={gradientId || undefined}
              seed={seed}
              withBorder={true}
              borderOpacity={0.2}
              zIndex={-1}
            />
            
            {/* Card content */}
            <View style={styles.cardContent}>
              <Text variant="headingMedium" style={styles.title}>
                Welcome to Practice
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                Experience the beautiful gradient animations powered by Skia
              </Text>
              <Text variant="bodySmall" style={styles.instructions}>
                Tap to change colors • Long press to change pattern
              </Text>
              <Text variant="bodySmall" style={styles.details}>
                Current: {gradientId} (Seed: {seed})
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    height: 400,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    padding: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 24,
  },
  instructions: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 32,
  },
  details: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 8,
    fontSize: 12,
  },
}); 