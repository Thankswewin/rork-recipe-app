import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Play, Square, Volume2 } from 'lucide-react-native';
import { useTTS } from '@/hooks/useTTS';

export const TTSPlayer: React.FC = () => {
  const [text, setText] = useState('');
  const { speak, stop, isSpeaking } = useTTS();

  const handleSpeak = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text to speak');
      return;
    }

    try {
      await speak(text);
    } catch (error) {
      Alert.alert('Error', 'Failed to speak text');
    }
  };

  const handleStop = () => {
    stop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Volume2 size={24} color="#007AFF" />
        <Text style={styles.title}>Text to Speech</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Enter text to speak..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.controls}>
        {!isSpeaking ? (
          <TouchableOpacity
            style={[styles.button, styles.playButton]}
            onPress={handleSpeak}
            disabled={!text.trim()}
          >
            <Play size={20} color="white" />
            <Text style={styles.buttonText}>Speak</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStop}
          >
            <Square size={20} color="white" />
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {Platform.OS === 'web' && (
        <Text style={styles.webNote}>
          Note: TTS features may be limited on web browsers
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  playButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  webNote: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TTSPlayer;