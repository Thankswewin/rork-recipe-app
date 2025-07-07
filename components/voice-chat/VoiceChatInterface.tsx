import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import { Mic, MicOff, Phone, PhoneOff, Settings, Volume2 } from 'lucide-react-native';
import { useVoiceChatStore } from '@/stores/voiceChatStore';
import { VoiceMessage } from '@/lib/realtime-voice';

interface VoiceChatInterfaceProps {
  onSettingsPress?: () => void;
}

export const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({
  onSettingsPress
}) => {
  const {
    isConnected,
    isConnecting,
    connectionStatus,
    isRecording,
    isListening,
    messages,
    pushToTalk,
    connect,
    disconnect,
    startRecording,
    stopRecording
  } = useVoiceChatStore();

  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Pulse animation for recording state
  useEffect(() => {
    if (isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isRecording, pulseAnim]);

  // Wave animation for listening state
  useEffect(() => {
    if (isListening) {
      const waveAnimation = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      waveAnimation.start();
      return () => waveAnimation.stop();
    } else {
      waveAnim.setValue(0);
    }
  }, [isListening, waveAnim]);

  const handleConnectionToggle = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#10B981';
      case 'connecting':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusDot, 
              { backgroundColor: getConnectionStatusColor() }
            ]} 
          />
          <Text style={styles.statusText}>
            {getConnectionStatusText()}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={onSettingsPress}
        >
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message: VoiceMessage) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Volume2 size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>
              Start a conversation by connecting and speaking
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Voice Visualization */}
      {isListening && (
        <View style={styles.visualizationContainer}>
          <Animated.View 
            style={[
              styles.waveBar,
              {
                transform: [{
                  scaleY: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1.5],
                  })
                }]
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.waveBar,
              {
                transform: [{
                  scaleY: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 0.4],
                  })
                }]
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.waveBar,
              {
                transform: [{
                  scaleY: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.2],
                  })
                }]
              }
            ]}
          />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Connection Button */}
        <TouchableOpacity
          style={[
            styles.connectionButton,
            isConnected ? styles.connectedButton : styles.disconnectedButton
          ]}
          onPress={handleConnectionToggle}
          disabled={isConnecting}
        >
          {isConnected ? (
            <PhoneOff size={24} color="#FFFFFF" />
          ) : (
            <Phone size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Microphone Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording ? styles.recordingButton : styles.idleButton,
              !isConnected && styles.disabledButton
            ]}
            onPress={handleMicToggle}
            disabled={!isConnected}
          >
            {isRecording ? (
              <MicOff size={32} color="#FFFFFF" />
            ) : (
              <Mic size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {!isConnected 
            ? 'Tap the phone icon to connect'
            : pushToTalk 
              ? 'Hold to speak, release to send'
              : 'Tap the microphone to start speaking'
          }
        </Text>
      </View>
    </View>
  );
};

const MessageBubble: React.FC<{ message: VoiceMessage }> = ({ message }) => {
  const isUser = message.type === 'user';
  
  return (
    <View style={[
      styles.messageBubble,
      isUser ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={[
        styles.messageText,
        isUser ? styles.userMessageText : styles.assistantMessageText
      ]}>
        {message.text}
      </Text>
      <Text style={styles.messageTime}>
        {new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  settingsButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  visualizationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  waveBar: {
    width: 4,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    gap: 40,
  },
  connectionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedButton: {
    backgroundColor: '#EF4444',
  },
  disconnectedButton: {
    backgroundColor: '#10B981',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  idleButton: {
    backgroundColor: '#6B7280',
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});