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
import { Mic, MicOff, Settings, Volume2, Zap, Radio } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Wave animation for listening state
  useEffect(() => {
    if (isListening || isRecording) {
      const waveAnimation = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      waveAnimation.start();
      return () => waveAnimation.stop();
    } else {
      waveAnim.setValue(0);
    }
  }, [isListening, isRecording, waveAnim]);

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

  const handleMicPressIn = async () => {
    if (pushToTalk && !isRecording) {
      await startRecording();
    }
  };

  const handleMicPressOut = () => {
    if (pushToTalk && isRecording) {
      stopRecording();
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to Kyutai...';
      case 'connected':
        return 'Connected • Real-time Voice';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Ready to Connect';
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
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Radio size={20} color="#3B82F6" />
              <Text style={styles.title}>Kyutai Voice</Text>
              <Zap size={16} color="#10B981" />
            </View>
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: getConnectionStatusColor() }
                ]} 
              />
              <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
                {getConnectionStatusText()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={onSettingsPress}
          >
            <Settings size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                style={styles.emptyIconGradient}
              >
                <Volume2 size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyStateTitle}>
              Start a Voice Conversation
            </Text>
            <Text style={styles.emptyStateText}>
              Connect and speak naturally with Kyutai's advanced AI.{'\n'}
              Experience ultra-low latency voice interaction.
            </Text>
          </View>
        )}

        {messages.map((message: VoiceMessage) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      {/* Voice Visualization */}
      {(isListening || isRecording) && (
        <View style={styles.visualizationContainer}>
          <Text style={styles.visualizationLabel}>
            {isRecording ? 'Listening...' : 'Processing...'}
          </Text>
          <View style={styles.waveContainer}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Animated.View 
                key={index}
                style={[
                  styles.waveBar,
                  {
                    transform: [{
                      scaleY: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1.8 - (index * 0.15)],
                      })
                    }]
                  }
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isConnected ? (
          <TouchableOpacity
            style={styles.connectButtonContainer}
            onPress={handleConnectionToggle}
            disabled={isConnecting}
          >
            <LinearGradient
              colors={isConnecting ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#2563EB']}
              style={styles.connectButton}
            >
              <Radio size={24} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>
                {isConnecting ? 'Connecting...' : 'Connect to Kyutai'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.connectedControls}>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleConnectionToggle}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.micButton,
                  isRecording ? styles.recordingButton : styles.idleButton
                ]}
                onPress={pushToTalk ? undefined : handleMicToggle}
                onPressIn={pushToTalk ? handleMicPressIn : undefined}
                onPressOut={pushToTalk ? handleMicPressOut : undefined}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isRecording 
                    ? ['#EF4444', '#DC2626'] 
                    : ['#10B981', '#059669']
                  }
                  style={styles.micButtonGradient}
                >
                  {isRecording ? (
                    <MicOff size={28} color="#FFFFFF" />
                  ) : (
                    <Mic size={28} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {!isConnected 
            ? 'Connect to start real-time voice conversation with Kyutai AI'
            : pushToTalk 
              ? 'Hold microphone to speak, release to send'
              : isRecording
                ? 'Speak naturally, tap microphone when finished'
                : 'Tap microphone to start speaking'
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
      <Text style={[
        styles.messageTime,
        isUser ? styles.userMessageTime : styles.assistantMessageTime
      ]}>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  messageBubble: {
    maxWidth: '85%',
    marginVertical: 6,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  assistantMessageTime: {
    color: '#9CA3AF',
    textAlign: 'left',
  },
  visualizationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  visualizationLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    height: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  connectButtonContainer: {
    borderRadius: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disconnectButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  micButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  idleButton: {},
  recordingButton: {},
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});