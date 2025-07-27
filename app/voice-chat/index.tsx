import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { VoiceChatInterface } from '@/components/voice-chat/VoiceChatInterface';
import { VoiceSettings } from '@/components/voice-chat/VoiceSettings';
import { useTheme } from '@/hooks/useTheme';

export default function VoiceChatScreen() {
  const { colors } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {showSettings ? (
        <VoiceSettings onClose={() => setShowSettings(false)} />
      ) : (
        <VoiceChatInterface onSettingsPress={() => setShowSettings(true)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});