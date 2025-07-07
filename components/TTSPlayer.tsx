import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Play, Pause, Square, Volume2, Settings } from 'lucide-react-native';
import { useTTS } from '@/hooks/useTTS';

interface TTSPlayerProps {
  initialText?: string;
  showControls?: boolean;
  showSettings?: boolean;
  lowLatency?: boolean;
}

export const TTSPlayer: React.FC<TTSPlayerProps> = ({
  initialText = '',
  showControls = true,
  showSettings = false,
  lowLatency = false,
}) => {
  const [text, setText] = useState(initialText);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { speak, stop, getVoices, isSpeaking, isLoading, error } = useTTS({
    rate,
    pitch,
    voice: selectedVoice,
    lowLatency,
    autoStop: true,
  });

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const availableVoices = await getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].identifier);
      }
    } catch (err) {
      console.error('Failed to load voices:', err);
    }
  };

  const handleSpeak = () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text to speak');
      return;
    }
    speak(text);
  };

  const handleStop = () => {
    stop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Text to Speech</Text>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder=\"Enter text to speak...\"
          multiline
          numberOfLines={4}
          textAlignVertical=\"top\"
        />
      </View>

      {showControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSpeak}
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? (
              <Volume2 size={20} color=\"white\" />
            ) : isSpeaking ? (
              <Pause size={20} color=\"white\" />
            ) : (
              <Play size={20} color=\"white\" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? 'Loading...' : isSpeaking ? 'Speaking' : 'Speak'}
            </Text>
          </TouchableOpacity>

          {isSpeaking && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleStop}
            >
              <Square size={20} color=\"#666\" />
              <Text style={[styles.buttonText, { color: '#666' }]}>Stop</Text>
            </TouchableOpacity>
          )}

          {showSettings && (
            <TouchableOpacity
              style={[styles.button, styles.settingsButton]}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings size={20} color=\"#666\" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {showAdvanced && (
        <ScrollView style={styles.advancedContainer}>
          <Text style={styles.sectionTitle}>Voice Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Rate: {rate.toFixed(1)}</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setRate(Math.max(0.1, rate - 0.1))}
              >
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={styles.sliderValue}>{rate.toFixed(1)}</Text>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setRate(Math.min(2.0, rate + 0.1))}
              >
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Pitch: {pitch.toFixed(1)}</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setPitch(Math.max(0.1, pitch - 0.1))}
              >
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={styles.sliderValue}>{pitch.toFixed(1)}</Text>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setPitch(Math.min(2.0, pitch + 0.1))}
              >
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {voices.length > 0 && (
            <View style={styles.voiceContainer}>
              <Text style={styles.settingLabel}>Voice</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {voices.map((voice, index) => (
                  <TouchableOpacity
                    key={voice.identifier}
                    style={[
                      styles.voiceButton,
                      selectedVoice === voice.identifier && styles.selectedVoice,
                    ]}
                    onPress={() => setSelectedVoice(voice.identifier)}
                  >
                    <Text
                      style={[
                        styles.voiceButtonText,
                        selectedVoice === voice.identifier && styles.selectedVoiceText,
                      ]}
                    >
                      {voice.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {lowLatency && (
            <View style={styles.featureContainer}>
              <Text style={styles.featureText}>🚀 Low Latency Mode Enabled</Text>
              <Text style={styles.featureSubtext}>
                Using advanced TTS for faster response times
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  settingsButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  advancedContainer: {
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  voiceContainer: {
    marginBottom: 16,
  },
  voiceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  selectedVoice: {
    backgroundColor: '#007AFF',
  },
  voiceButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedVoiceText: {
    color: 'white',
  },
  featureContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  featureSubtext: {
    fontSize: 14,
    color: '#4caf50',
    marginTop: 4,
  },
});