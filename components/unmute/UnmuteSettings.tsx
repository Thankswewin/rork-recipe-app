import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Switch,
  Alert
} from 'react-native';
import {
  Settings,
  Server,
  Volume2,
  Globe,
  MessageSquare,
  Thermometer,
  Hash,
  Mic,
  Save,
  RotateCcw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUnmuteStore } from '@/stores/unmuteStore';
import { UNMUTE_VOICES, SUPPORTED_LANGUAGES } from '@/lib/unmute-client';

interface UnmuteSettingsProps {
  onClose?: () => void;
}

export const UnmuteSettings: React.FC<UnmuteSettingsProps> = ({ onClose }) => {
  const {
    serverUrl,
    selectedVoice,
    selectedLanguage,
    instructions,
    temperature,
    maxTokens,
    pushToTalk,
    isConnected,
    setServerUrl,
    setVoice,
    setLanguage,
    setInstructions,
    setTemperature,
    setMaxTokens,
    setPushToTalk,
    addDebugLog
  } = useUnmuteStore();

  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  const [localInstructions, setLocalInstructions] = useState(instructions);
  const [localTemperature, setLocalTemperature] = useState(temperature.toString());
  const [localMaxTokens, setLocalMaxTokens] = useState(maxTokens.toString());
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSave = () => {
    // Validate inputs
    const tempValue = parseFloat(localTemperature);
    const tokensValue = parseInt(localMaxTokens);

    if (isNaN(tempValue) || tempValue < 0 || tempValue > 2) {
      Alert.alert('Invalid Temperature', 'Temperature must be between 0 and 2');
      return;
    }

    if (isNaN(tokensValue) || tokensValue < 1 || tokensValue > 4000) {
      Alert.alert('Invalid Max Tokens', 'Max tokens must be between 1 and 4000');
      return;
    }

    if (!localServerUrl.trim()) {
      Alert.alert('Invalid Server URL', 'Server URL cannot be empty');
      return;
    }

    // Save settings
    setServerUrl(localServerUrl.trim());
    setInstructions(localInstructions.trim());
    setTemperature(tempValue);
    setMaxTokens(tokensValue);

    addDebugLog({
      level: 'success',
      message: 'Settings saved successfully'
    });

    if (onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setLocalServerUrl('ws://localhost:8000/ws');
            setLocalInstructions('You are a helpful voice assistant. Respond naturally and conversationally in 1-2 sentences.');
            setLocalTemperature('0.8');
            setLocalMaxTokens('150');
            setVoice('alloy');
            setLanguage('en');
            setPushToTalk(false);
            
            addDebugLog({
              level: 'info',
              message: 'Settings reset to defaults'
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Settings size={24} color="#8B5CF6" />
            <Text style={styles.title}>Unmute Settings</Text>
          </View>
          {isConnected && (
            <View style={styles.connectionWarning}>
              <Text style={styles.warningText}>
                Some changes require reconnection to take effect
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Server Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Server size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>Server Configuration</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Server URL</Text>
            <TextInput
              style={styles.textInput}
              value={localServerUrl}
              onChangeText={setLocalServerUrl}
              placeholder="ws://localhost:8000/ws"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputHint}>
              WebSocket URL of your Unmute server
            </Text>
          </View>
        </View>

        {/* Voice Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Volume2 size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>Voice Settings</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Voice</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.voiceGrid}>
                {UNMUTE_VOICES.map((voice) => (
                  <TouchableOpacity
                    key={voice.id}
                    style={[
                      styles.voiceCard,
                      selectedVoice === voice.id && styles.voiceCardSelected
                    ]}
                    onPress={() => setVoice(voice.id)}
                  >
                    <Text style={[
                      styles.voiceName,
                      selectedVoice === voice.id && styles.voiceNameSelected
                    ]}>
                      {voice.name}
                    </Text>
                    <Text style={[
                      styles.voiceDescription,
                      selectedVoice === voice.id && styles.voiceDescriptionSelected
                    ]}>
                      {voice.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.languageGrid}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageChip,
                      selectedLanguage === lang.code && styles.languageChipSelected
                    ]}
                    onPress={() => setLanguage(lang.code)}
                  >
                    <Globe size={14} color={selectedLanguage === lang.code ? "#FFFFFF" : "#6B7280"} />
                    <Text style={[
                      styles.languageText,
                      selectedLanguage === lang.code && styles.languageTextSelected
                    ]}>
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Input Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mic size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>Input Settings</Text>
          </View>
          
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Push to Talk</Text>
              <Text style={styles.switchDescription}>
                Hold microphone button to record, release to send
              </Text>
            </View>
            <Switch
              value={pushToTalk}
              onValueChange={setPushToTalk}
              trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
              thumbColor={pushToTalk ? '#8B5CF6' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* AI Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>AI Configuration</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>System Instructions</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={localInstructions}
              onChangeText={setLocalInstructions}
              placeholder="Enter system instructions for the AI..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
            <Text style={styles.inputHint}>
              Instructions that define the AI's behavior and personality
            </Text>
          </View>

          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </Text>
          </TouchableOpacity>

          {showAdvanced && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Temperature</Text>
                <TextInput
                  style={styles.textInput}
                  value={localTemperature}
                  onChangeText={setLocalTemperature}
                  placeholder="0.8"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputHint}>
                  Controls randomness (0.0 = deterministic, 2.0 = very random)
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Max Tokens</Text>
                <TextInput
                  style={styles.textInput}
                  value={localMaxTokens}
                  onChangeText={setLocalMaxTokens}
                  placeholder="150"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
                <Text style={styles.inputHint}>
                  Maximum length of AI responses (1-4000)
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <RotateCcw size={18} color="#6B7280" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButtonContainer} onPress={handleSave}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.saveButton}
          >
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  connectionWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  voiceGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  voiceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    minWidth: 140,
  },
  voiceCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  voiceNameSelected: {
    color: '#8B5CF6',
  },
  voiceDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  voiceDescriptionSelected: {
    color: '#7C3AED',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
  },
  languageChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  languageTextSelected: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  advancedToggle: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  advancedToggleText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButtonContainer: {
    flex: 1,
    borderRadius: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});