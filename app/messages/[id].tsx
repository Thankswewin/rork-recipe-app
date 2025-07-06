// This conversation screen has been removed as DM functionality is no longer needed
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { MessageCircleOff } from 'lucide-react-native';

export default function RemovedConversationScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Messaging Removed',
          headerStyle: { backgroundColor: colors.cardBackground },
          headerTintColor: colors.text,
        }}
      />
      
      <View style={styles.content}>
        <MessageCircleOff size={64} color={colors.muted} />
        <Text style={[styles.title, { color: colors.text }]}>Messaging Removed</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Direct messaging functionality has been removed from this app.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});