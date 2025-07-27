import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  TextInput
} from 'react-native';
import { 
  Mic, 
  MicOff, 
  Settings, 
  Volume2, 
  Zap, 
  Radio, 
  Bug, 
  ChevronDown, 
  ChevronUp,
  Send,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUnmuteStore } from '@/stores/unmuteStore';
import { VoiceMessage } from '@/lib/unmute-client';
import { RunPodSetupHelper } from './RunPodSetupHelper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  spacing,
  typography,
  borderRadius,
  colorPalette,
  shadows,
} from '@/constants/designSystem';

interface UnmuteInterfaceProps {
  onSettingsPress?: () => void;
}

export const UnmuteInterface: React.FC<UnmuteInterfaceProps> = ({
  onSettingsPress
}) => {
  const {
    isConnected,
    isConnecting,
    connectionStatus,
    isRecording,
    isListening,
    messages,
    debugLogs,
    serverUrl,
    pushToTalk,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendMessage,
    clearDebugLogs
  } = useUnmuteStore();

  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [showSetupHelper, setShowSetupHelper] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const debugScrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (debugLogs.length > 0) {
      setTimeout(() => {
        debugScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [debugLogs]);

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

  const handleSendText = async () => {
    if (textInput.trim() && isConnected) {
      await sendMessage(textInput.trim());
      setTextInput('');
      setShowTextInput(false);
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to Unmute...';
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

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return '#EF4444';
      case 'warn':
        return '#F59E0B';
      case 'success':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  if (showSetupHelper) {
    return (
      <RunPodSetupHelper onClose={() => setShowSetupHelper(false)} />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Server size={20} color="#8B5CF6" />
              <Text style={styles.title}>Unmute Voice Chat</Text>
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
            <View style={styles.serverInfo}>
              <Text style={styles.serverUrl}>{serverUrl}</Text>
            </View>
          </View>
          
          <View style={styles.headerButtons}>
            <Button
              variant={showDebugPanel ? 'purple' : 'ghost'}
              size="icon"
              icon={Bug}
              iconSize={18}
              onPress={() => setShowDebugPanel(!showDebugPanel)}
            />
            
            <Button
              variant="ghost"
              size="icon"
              icon={Settings}
              iconSize={22}
              onPress={onSettingsPress}
            />
          </View>
        </View>
      </View>

      {/* Debug Panel */}
      {showDebugPanel && (
        <View style={styles.debugPanel}>
          <View style={styles.debugHeader}>
            <View style={styles.debugTitleRow}>
              <Bug size={16} color="#8B5CF6" />
              <Text style={styles.debugTitle}>Debug Console</Text>
              <Button
                variant="ghost"
                size="sm"
                title="Clear"
                onPress={clearDebugLogs}
                style={styles.clearLogsButton}
              />
            </View>
            <Button
              variant="ghost"
              size="icon"
              icon={ChevronUp}
              iconSize={16}
              onPress={() => setShowDebugPanel(false)}
            />
          </View>
          
          <ScrollView 
            ref={debugScrollRef}
            style={styles.debugLogs}
            showsVerticalScrollIndicator={false}
          >
            {debugLogs.length === 0 ? (
              <Text style={styles.noLogsText}>No debug logs yet. Start using Unmute to see logs.</Text>
            ) : (
              debugLogs.map((log, index) => (
                <View key={index} style={styles.debugLogItem}>
                  <View style={styles.debugLogHeader}>
                    <Text style={[styles.debugLogLevel, { color: getLogLevelColor(log.level) }]}>
                      {log.level.toUpperCase()}
                    </Text>
                    <Text style={styles.debugLogTime}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.debugLogMessage}>{log.message}</Text>
                  {log.data && (
                    <Text style={styles.debugLogData}>
                      {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                    </Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

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
                colors={['#8B5CF6', '#3B82F6']}
                style={styles.emptyIconGradient}
              >
                <Volume2 size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyStateTitle}>
              Start Real-time Voice Chat
            </Text>
            <Text style={styles.emptyStateText}>
              Connect to your Unmute server and experience{'\n'}
              low-latency voice conversation with AI.
            </Text>
            <View style={styles.emptyStateButtons}>
              <TouchableOpacity 
                style={styles.setupButton}
                onPress={() => setShowSetupHelper(true)}
              >
                <Server size={16} color="#FFFFFF" />
                <Text style={styles.setupButtonText}>Setup Server</Text>
              </TouchableOpacity>
              {!showDebugPanel && (
                <Button
                variant="outline"
                size="sm"
                icon={Bug}
                iconSize={16}
                title="Debug Console"
                onPress={() => setShowDebugPanel(true)}
                style={styles.showDebugButton}
              />
              )}
            </View>
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

      {/* Text Input */}
      {showTextInput && (
        <View style={styles.textInputContainer}>
          <Input
            value={textInput}
            onChangeText={setTextInput}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            style={styles.textInput}
            rightIcon={Send}
            rightIconProps={{
              size: 20,
              color: textInput.trim() ? colorPalette.purple[600] : colorPalette.gray[400],
              onPress: textInput.trim() ? handleSendText : undefined,
            }}
          />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isConnected ? (
          <Button
            variant="purple"
            size="lg"
            icon={isConnecting ? Wifi : Server}
            iconSize={24}
            title={isConnecting ? 'Connecting...' : 'Connect to Unmute'}
            loading={isConnecting}
            gradient
            fullWidth
            onPress={handleConnectionToggle}
            disabled={isConnecting}
            style={styles.connectButton}
          />
        ) : (
          <View style={styles.connectedControls}>
            <Button
              variant="secondary"
              size="sm"
              icon={WifiOff}
              iconSize={16}
              title="Disconnect"
              onPress={handleConnectionToggle}
            />

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => setShowTextInput(!showTextInput)}
            >
              <Send size={16} color="#8B5CF6" />
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Button
                variant={isRecording ? 'primary' : 'purple'}
                size="iconLg"
                icon={isRecording ? MicOff : Mic}
                iconSize={28}
                gradient
                shadow
                onPress={pushToTalk ? undefined : handleMicToggle}
                onPressIn={pushToTalk ? handleMicPressIn : undefined}
                onPressOut={pushToTalk ? handleMicPressOut : undefined}
                style={styles.micButton}
              />
            </Animated.View>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {!isConnected 
            ? 'Connect to your Unmute server to start real-time voice conversation'
            : pushToTalk 
              ? 'Hold microphone to speak, release to send'
              : isRecording
                ? 'Speak naturally, tap microphone when finished'
                : 'Tap microphone to start speaking or use text input'
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
    backgroundColor: colorPalette.gray[50],
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.gray[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.weights.bold,
    color: colorPalette.gray[900],
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.sm,
    fontWeight: typography.weights.medium,
  },
  serverInfo: {
    marginTop: 2,
  },
  serverUrl: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  debugPanel: {
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    maxHeight: 200,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  debugTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearLogsButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  clearLogsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  collapseButton: {
    padding: 4,
  },
  debugLogs: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noLogsText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  debugLogItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  debugLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  debugLogLevel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  debugLogTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  debugLogMessage: {
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 18,
  },
  debugLogData: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
    paddingLeft: 8,
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
    marginBottom: 20,
  },
  showDebugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  showDebugText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  emptyStateButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
  },
  setupButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  textInputContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colorPalette.gray[200],
  },
  textInput: {
    maxHeight: 100,
  },
  controls: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colorPalette.gray[200],
  },
  connectButton: {
    borderRadius: borderRadius.xl,
  },
  connectedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  micButton: {
    width: 72,
    height: 72,
  },
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