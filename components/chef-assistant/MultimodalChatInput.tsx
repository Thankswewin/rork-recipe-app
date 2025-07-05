import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, Platform } from 'react-native';
import { Send, Camera, Mic, Square } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useChefAssistantStore } from '@/stores/chefAssistantStore';

interface MultimodalChatInputProps {
  onSendMessage: (message: string, imageUri?: string) => void;
  disabled?: boolean;
}

export default function MultimodalChatInput({ onSendMessage, disabled }: MultimodalChatInputProps) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const { isRecording, setRecording, processVoiceCommand } = useChefAssistantStore();

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        onSendMessage(message.trim() || 'Please analyze this image', imageUri);
        setMessage('');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleVoiceRecord = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Voice recording is not available on web');
      return;
    }

    try {
      if (isRecording) {
        // Stop recording
        setRecording(false);
        // In a real implementation, you'd stop the audio recording here
        // and process the audio file
        console.log('Stopping voice recording...');
      } else {
        // Start recording
        setRecording(true);
        // In a real implementation, you'd start audio recording here
        console.log('Starting voice recording...');
        
        // Simulate recording for demo
        setTimeout(() => {
          setRecording(false);
          // Simulate processing voice command
          processVoiceCommand('dummy-audio-uri');
        }, 3000);
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setRecording(false);
      Alert.alert('Error', 'Failed to record voice');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask me anything about cooking..."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={500}
          editable={!disabled}
        />
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCamera}
            disabled={disabled}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FACC15', borderColor: colors.iconBorder }]}>
              <Camera size={16} color="black" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleVoiceRecord}
            disabled={disabled}
          >
            <View style={[
              styles.iconContainer, 
              { 
                backgroundColor: isRecording ? '#EF4444' : '#10B981',
                borderColor: colors.iconBorder 
              }
            ]}>
              {isRecording ? (
                <Square size={16} color="black" />
              ) : (
                <Mic size={16} color="black" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.sendButtonContainer}
        onPress={handleSend}
        disabled={disabled || !message.trim()}
      >
        <LinearGradient
          colors={message.trim() && !disabled ? ["#3B82F6", "#1D4ED8"] : ["#9CA3AF", "#6B7280"]}
          style={styles.sendButton}
        >
          <Send size={18} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <LinearGradient
            colors={["#EF4444", "#DC2626"]}
            style={styles.recordingBadge}
          >
            <Text style={styles.recordingText}>🎤 Recording...</Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopWidth: 1,
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  sendButtonContainer: {
    alignSelf: 'flex-end',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -40,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  recordingBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});