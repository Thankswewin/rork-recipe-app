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
import { Play, Square, Volume2, Radio, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTTS } from '@/hooks/useTTS';
import { useTheme } from '@/hooks/useTheme';

interface TTSPlayerProps {
  initialText?: string;
  showControls?: boolean;
  showSettings?: boolean;
  lowLatency?: boolean;
  realTimeMode?: boolean;
}

export const TTSPlayer: React.FC<TTSPlayerProps> = ({ 
  initialText = '',
  showControls = true,
  showSettings = false,
  lowLatency = false,
  realTimeMode = false
}) => {
  const { colors } = useTheme();
  const [text, setText] = useState(initialText);
  
  const { 
    speak, 
    speakInstant,
    stop, 
    isSpeaking, 
    isLoading,
    isRealtimeMode,
    toggleRealtimeMode,
    latencyStats,
    error
  } = useTTS({ 
    lowLatency,
    realTimeMode,
    voiceStyle: 'natural-female',
  });

  const handleSpeak = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text to speak');
      return;
    }

    try {
      if (isRealtimeMode) {
        await speakInstant(text);
      } else {
        await speak(text);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to speak text');
    }
  };

  const handleStop = () => {
    stop();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Volume2 size={24} color="#007AFF" />
        <Text style={[styles.title, { color: colors.text }]}>Kyutai Text to Speech</Text>
        {isRealtimeMode && (
          <View style={styles.realtimeBadge}>
            <Radio size={16} color="#10B981" />
            <Text style={styles.realtimeText}>REAL-TIME</Text>
          </View>
        )}
      </View>

      {/* Real-time Toggle */}
      {showSettings && (
        <View style={[styles.settingsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Real-time Mode</Text>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: isRealtimeMode ? '#10B981' : colors.border }]}
              onPress={toggleRealtimeMode}
            >
              <View style={[styles.toggleThumb, { transform: [{ translateX: isRealtimeMode ? 20 : 0 }] }]} />
            </TouchableOpacity>
          </View>
          
          {latencyStats && (
            <View style={styles.statsRow}>
              <Text style={[styles.statText, { color: colors.muted }]}>
                Latency: {latencyStats.lastLatency}ms | Model: {latencyStats.voiceModel}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Enter text to speak..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {showControls && (
        <View style={styles.controls}>
          {!isSpeaking ? (
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleSpeak}
              disabled={!text.trim() || isLoading}
            >
              <LinearGradient
                colors={isRealtimeMode ? ['#10B981', '#059669'] : ['#007AFF', '#0056CC']}
                style={styles.button}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Preparing...</Text>
                ) : (
                  <>
                    <Play size={20} color="white" />
                    <Text style={styles.buttonText}>
                      {isRealtimeMode ? 'Speak Instant' : 'Speak'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleStop}
            >
              <LinearGradient
                colors={['#FF3B30', '#CC2E24']}
                style={styles.button}
              >
                <Square size={20} color="white" />
                <Text style={styles.buttonText}>Stop</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (text.trim()) {
                handleSpeak();
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {Platform.OS === 'web' && (
        <Text style={[styles.webNote, { color: colors.muted }]}>
          Web: Kyutai TTS with streaming support for natural voices
        </Text>
      )}

      {Platform.OS === 'ios' && (
        <Text style={[styles.webNote, { color: colors.muted }]}>
          iOS: Kyutai TTS with MLX on-device inference for ultra-low latency
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  realtimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  settingsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
  },
  statsRow: {
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    borderRadius: 25,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  webNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TTSPlayer;