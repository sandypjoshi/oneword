import React from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';

export default function ProfileScreen() {
  const { isReady, theme } = useThemeReady();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { spacing, colors } = theme;

  return (
    <ScrollView style={styles.container}>
      <Box padding="lg">
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text variant="h2" color={colors.background.primary}>U</Text>
          </View>
          <Text variant="h1" style={{ marginTop: spacing.md }}>User Profile</Text>
        </View>

        <Box 
          style={[
            styles.card, 
            { 
              marginTop: spacing.lg,
              marginBottom: spacing.md,
              backgroundColor: colors.background.secondary,
              padding: spacing.lg,
              borderRadius: 8
            }
          ]}
        >
          <Text variant="h2" style={{ marginBottom: spacing.sm }}>Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="body1">Words Learned</Text>
              <Text variant="h3">42</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="body1">Practice Sessions</Text>
              <Text variant="h3">12</Text>
            </View>
          </View>
        </Box>
        
        <Box 
          style={[
            styles.card, 
            { 
              marginBottom: spacing.md,
              backgroundColor: colors.background.secondary,
              padding: spacing.lg,
              borderRadius: 8
            }
          ]}
        >
          <Text variant="h2" style={{ marginBottom: spacing.sm }}>Achievements</Text>
          <Text variant="body1">• First word learned</Text>
          <Text variant="body1">• Completed 10 practice sessions</Text>
          <Text variant="body1">• Learned 25 words</Text>
        </Box>
        
        <Box 
          style={[
            styles.card, 
            { 
              backgroundColor: colors.background.secondary,
              padding: spacing.lg,
              borderRadius: 8
            }
          ]}
        >
          <Text variant="h2" style={{ marginBottom: spacing.sm }}>Preferences</Text>
          <Text variant="body1">• Notification settings</Text>
          <Text variant="body1">• Theme selection</Text>
          <Text variant="body1">• Account settings</Text>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
}); 