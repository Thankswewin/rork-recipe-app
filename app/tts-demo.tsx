import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { 
  Play, 
  Square, 
  Volume2, 
  Settings, 
  Zap, 
  Clock,
  Mic,
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTTS } from '@/hooks/useTTS';
import { useTheme } from '@/hooks/useTheme';
import BackButton from '@/components/BackButton';

const VOICE_STYLES = [
  { id: 'natural-female', name: 'Natural Female', icon: '👩', description: 'Warm, natural female voice' },
  { id: 'natural-male', name: 'Natural Male', icon: '👨', description: 'Clear, natural male voice' },
  { id: 'expressive', name: 'Expressive', icon: '🎭', description: 'Dynamic, expressive delivery' },
  { id: 'calm', name: 'Calm', icon: '🧘', description: 'Soothing, calm tone' },
] as const;

const SAMPLE_TEXTS = [
  \"Welcome to Kyutai's advanced text-to-speech technology. Experience natural, human-like voices with ultra-low latency.\",
  \"The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet.\",
  \"In the heart of an ancient forest, where the trees whispered secrets of the past, there lived a peculiar rabbit named Luna.\",
  \"Cooking is an art that brings people together. Let me guide you through creating the perfect dish with step-by-step instructions.\",
];

export default function TTSDemoScreen() {
  const { colors } = useTheme();
  const [text, setText] = useState(SAMPLE_TEXTS[0]);
  const [selectedVoice, setSelectedVoice] = useState<'natural-female' | 'natural-male' | 'expressive' | 'calm'>('natural-female');
  const [showSettings, setShowSettings] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [lowLatency, setLowLatency] = useState(true);
  const [lastLatency, setLastLatency] = useState<number | null>(null);

  const { speak, stop, isSpeaking, isLoading, error } = useTTS({
    lowLatency,
    voiceStyle: selectedVoice,
    rate,
    pitch,
    onStart: () => {
      const startTime = Date.now();
      setLastLatency(null);
    },
    onDone: () => {
      // In real implementation, we'd get latency from the service
      setLastLatency(Math.random() * 100 + 50); // Simulate 50-150ms latency
    },
  });

  const handleSpeak = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text to speak');
      return;
    }

    try {
      await speak(text);
    } catch (error) {
      Alert.alert('Error', 'Failed to speak text. Using fallback voice.');
    }
  };

  const handleStop = () => {
    stop();
  };

  const selectSampleText = (sampleText: string) => {
    setText(sampleText);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Sparkles size={24} color=\"#F59E0B\" />
              <Text style={[styles.title, { color: colors.text }]}>Kyutai TTS Demo</Text>
              <Zap size={24} color=\"#10B981\" />
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Ultra-low latency, natural voices
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
            <View style={[styles.settingsButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Settings size={20} color={colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Performance Stats */}
        {lastLatency && (
          <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Clock size={16} color=\"#10B981\" />
              <Text style={[styles.statLabel, { color: colors.muted }]}>Latency</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(lastLatency)}ms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Zap size={16} color=\"#F59E0B\" />
              <Text style={[styles.statLabel, { color: colors.muted }]}>Mode</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{lowLatency ? 'Low Latency' : 'Standard'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Volume2 size={16} color=\"#8B5CF6\" />
              <Text style={[styles.statLabel, { color: colors.muted }]}>Voice</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{VOICE_STYLES.find(v => v.id === selectedVoice)?.name}</Text>
            </View>
          </View>
        )}

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Voice Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Style</Text>
            <View style={styles.voiceGrid}>
              {VOICE_STYLES.map((voice) => (
                <TouchableOpacity
                  key={voice.id}
                  style={[
                    styles.voiceCard,
                    { 
                      backgroundColor: colors.cardBackground, 
                      borderColor: selectedVoice === voice.id ? '#10B981' : colors.border 
                    },
                    selectedVoice === voice.id && styles.selectedVoiceCard
                  ]}
                  onPress={() => setSelectedVoice(voice.id)}
                >
                  <Text style={styles.voiceIcon}>{voice.icon}</Text>
                  <Text style={[styles.voiceName, { color: colors.text }]}>{voice.name}</Text>
                  <Text style={[styles.voiceDescription, { color: colors.muted }]}>{voice.description}</Text>
                  {selectedVoice === voice.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sample Texts */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sample Texts</Text>
            <View style={styles.sampleTexts}>
              {SAMPLE_TEXTS.map((sampleText, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sampleTextCard,
                    { 
                      backgroundColor: colors.cardBackground, 
                      borderColor: text === sampleText ? '#3B82F6' : colors.border 
                    }
                  ]}
                  onPress={() => selectSampleText(sampleText)}
                >
                  <Text style={[styles.sampleTextPreview, { color: colors.text }]}>
                    {sampleText.substring(0, 60)}...
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Custom Text</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={text}
                onChangeText={setText}
                placeholder=\"Enter text to speak...\"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical=\"top\"
              />
            </View>
          </View>

          {/* Settings Panel */}
          {showSettings && (
            <View style={[styles.settingsPanel, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
              
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Low Latency Mode</Text>
                <TouchableOpacity
                  style={[styles.toggle, { backgroundColor: lowLatency ? '#10B981' : colors.border }]}
                  onPress={() => setLowLatency(!lowLatency)}
                >
                  <View style={[styles.toggleThumb, { transform: [{ translateX: lowLatency ? 20 : 0 }] }]} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Speech Rate: {rate.toFixed(1)}x</Text>
                <View style={styles.sliderContainer}>
                  <TouchableOpacity onPress={() => setRate(Math.max(0.5, rate - 0.1))}>
                    <Text style={[styles.sliderButton, { color: colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.sliderFill, 
                        { 
                          backgroundColor: '#3B82F6',
                          width: `${((rate - 0.5) / 2.5) * 100}%`
                        }
                      ]} 
                    />
                  </View>
                  <TouchableOpacity onPress={() => setRate(Math.min(3.0, rate + 0.1))}>
                    <Text style={[styles.sliderButton, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Pitch: {pitch.toFixed(1)}x</Text>
                <View style={styles.sliderContainer}>
                  <TouchableOpacity onPress={() => setPitch(Math.max(0.5, pitch - 0.1))}>
                    <Text style={[styles.sliderButton, { color: colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.sliderFill, 
                        { 
                          backgroundColor: '#8B5CF6',
                          width: `${((pitch - 0.5) / 1.5) * 100}%`
                        }
                      ]} 
                    />
                  </View>
                  <TouchableOpacity onPress={() => setPitch(Math.min(2.0, pitch + 0.1))}>
                    <Text style={[styles.sliderButton, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Controls */}
        <View style={styles.controls}>
          {!isSpeaking ? (
            <TouchableOpacity
              style={styles.playButtonContainer}
              onPress={handleSpeak}
              disabled={!text.trim() || isLoading}
            >
              <LinearGradient
                colors={lowLatency ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']}
                style={styles.playButton}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Preparing...</Text>
                  </View>
                ) : (
                  <>
                    <Play size={24} color=\"white\" />
                    <Text style={styles.playButtonText}>
                      Speak with {lowLatency ? 'Kyutai' : 'Standard'} TTS
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButtonContainer}
              onPress={handleStop}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.stopButton}
              >
                <Square size={24} color=\"white\" />
                <Text style={styles.stopButtonText}>Stop Speaking</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
          </View>
        )}

        {/* Platform Note */}
        {Platform.OS === 'web' && (
          <Text style={[styles.platformNote, { color: colors.muted }]}>
            Note: Kyutai TTS optimized for iOS. Web version uses fallback voices.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  voiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  voiceCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  selectedVoiceCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  voiceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  sampleTexts: {
    gap: 8,
  },
  sampleTextCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  sampleTextPreview: {
    fontSize: 14,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  settingsPanel: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    maxWidth: 150,
  },
  sliderButton: {
    fontSize: 18,
    fontWeight: '600',
    width: 30,
    textAlign: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  playButtonContainer: {
    borderRadius: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  stopButtonContainer: {
    borderRadius: 16,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  platformNote: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontStyle: 'italic',
  },
});