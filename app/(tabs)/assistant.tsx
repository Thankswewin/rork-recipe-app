import React, { useState } from 'react';
import { View, StyleSheet, Modal, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { VoiceChatInterface } from '@/components/voice-chat/VoiceChatInterface';
import { VoiceSettings } from '@/components/voice-chat/VoiceSettings';

export default function AssistantScreen() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Voice Assistant',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            color: '#111827',
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }} 
      />
      
      <View style={styles.container}>
        <VoiceChatInterface 
          onSettingsPress={() => setShowSettings(true)}
        />
        
        <Modal
          visible={showSettings}
          animationType="slide"
          presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalContainer}>
            <VoiceSettings onClose={() => setShowSettings(false)} />
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});