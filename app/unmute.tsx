import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { UnmuteInterface } from '@/components/unmute/UnmuteInterface';
import { UnmuteSettings } from '@/components/unmute/UnmuteSettings';

export default function UnmutePage() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Unmute Voice Chat'
        }} 
      />
      
      {showSettings ? (
        <UnmuteSettings onClose={() => setShowSettings(false)} />
      ) : (
        <UnmuteInterface onSettingsPress={() => setShowSettings(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});