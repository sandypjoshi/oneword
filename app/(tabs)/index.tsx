import React from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text } from '../../src/components/ui';
import { WordOfDayCard } from '../../src/features/word-of-day';
import { useThemeReady } from '../../src/hooks';

export default function HomeScreen() {
  const { isReady, theme } = useThemeReady();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Box padding="lg">
        <Text variant="h1" style={{ marginBottom: theme.spacing.md }}>Word of the Day</Text>
        <WordOfDayCard
          word="Serendipity"
          definition="The occurrence and development of events by chance in a happy or beneficial way"
          example="A fortunate happenstance or pleasant surprise"
          partOfSpeech="noun"
        />
        <Text variant="h2" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.md }}>Recent Words</Text>
        {/* Sample recent words */}
        <Box style={{ marginBottom: theme.spacing.md }}>
          <WordOfDayCard
            word="Ephemeral"
            definition="Lasting for a very short time"
            example="Fashions are ephemeral"
            partOfSpeech="adjective"
          />
        </Box>
        <Box style={{ marginBottom: theme.spacing.md }}>
          <WordOfDayCard
            word="Ubiquitous"
            definition="Present, appearing, or found everywhere"
            example="Ubiquitous computing"
            partOfSpeech="adjective"
          />
        </Box>
      </Box>
    </ScrollView>
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
}); 