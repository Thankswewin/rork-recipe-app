import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { UnmuteInterface } from '@/components/unmute/UnmuteInterface';
import { UnmuteSettings } from '@/components/unmute/UnmuteSettings';

export default function UnmuteTab() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <View style={styles.container}>
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