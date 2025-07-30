import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { MoshiInterface } from '@/components/moshi/MoshiInterface';
import { MoshiSettings } from '@/components/moshi/MoshiSettings';
import { useTheme } from '@/hooks/useTheme';

export default function UnmuteScreen() {
  const { colors } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {showSettings ? (
        <MoshiSettings onClose={() => setShowSettings(false)} />
      ) : (
        <MoshiInterface onSettingsPress={() => setShowSettings(true)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});