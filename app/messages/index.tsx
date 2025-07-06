// This messaging screen has been removed as DM functionality is no longer needed
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { MessageCircleOff } from 'lucide-react-native';
import BackButton from '@/components/BackButton';

export default function RemovedMessagesScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <MessageCircleOff size={64} color={colors.muted} />
        <Text style={[styles.messageTitle, { color: colors.text }]}>Messaging Removed</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  messageTitle: {
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