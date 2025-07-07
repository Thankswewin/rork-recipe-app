import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch
} from 'react-native';
import { ChevronRight, Volume2, Mic, Globe } from 'lucide-react-native';
import { useVoiceChatStore } from '@/stores/voiceChatStore';
import { KYUTAI_VOICES, SUPPORTED_LANGUAGES } from '@/lib/realtime-voice';

interface VoiceSettingsProps {
  onClose?: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ onClose }) => {
  const {
    selectedVoice,
    selectedLanguage,
    autoPlay,
    pushToTalk,
    setVoice,
    setLanguage,
    setAutoPlay,
    setPushToTalk
  } = useVoiceChatStore();

  const selectedVoiceData = KYUTAI_VOICES.find(v => v.id === selectedVoice);
  const selectedLanguageData = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Settings</Text>
        <Text style={styles.subtitle}>
          Customize your voice chat experience
        </Text>
      </View>

      {/* Voice Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Volume2 size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Voice</Text>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Selected Voice</Text>
            <Text style={styles.settingValue}>
              {selectedVoiceData?.name} - {selectedVoiceData?.description}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </View>

        <View style={styles.voiceGrid}>
          {KYUTAI_VOICES.map((voice) => (
            <TouchableOpacity
              key={voice.id}
              style={[
                styles.voiceCard,
                selectedVoice === voice.id && styles.selectedVoiceCard
              ]}
              onPress={() => setVoice(voice.id)}
            >
              <Text style={[
                styles.voiceName,
                selectedVoice === voice.id && styles.selectedVoiceName
              ]}>
                {voice.name}
              </Text>
              <Text style={[
                styles.voiceDescription,
                selectedVoice === voice.id && styles.selectedVoiceDescription
              ]}>
                {voice.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Language Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Language</Text>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Selected Language</Text>
            <Text style={styles.settingValue}>
              {selectedLanguageData?.name}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </View>

        <View style={styles.languageList}>
          {SUPPORTED_LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                selectedLanguage === language.code && styles.selectedLanguageItem
              ]}
              onPress={() => setLanguage(language.code)}
            >
              <Text style={[
                styles.languageName,
                selectedLanguage === language.code && styles.selectedLanguageName
              ]}>
                {language.name}
              </Text>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Audio Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Mic size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Audio Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-play Responses</Text>
            <Text style={styles.settingDescription}>
              Automatically play AI responses when received
            </Text>
          </View>
          <Switch
            value={autoPlay}
            onValueChange={setAutoPlay}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={autoPlay ? '#3B82F6' : '#FFFFFF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push to Talk</Text>
            <Text style={styles.settingDescription}>
              Hold microphone button to speak, release to send
            </Text>
          </View>
          <Switch
            value={pushToTalk}
            onValueChange={setPushToTalk}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={pushToTalk ? '#3B82F6' : '#FFFFFF'}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.aboutTitle}>About Kyutai Voice</Text>
        <Text style={styles.aboutText}>
          Powered by Kyutai's advanced neural text-to-speech technology, 
          delivering natural, human-like voices with ultra-low latency 
          for real-time conversations.
        </Text>
        <Text style={styles.aboutText}>
          Features include real-time speech recognition, natural language 
          processing, and high-quality voice synthesis optimized for 
          conversational AI applications.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  voiceGrid: {
    marginTop: 16,
  },
  voiceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  selectedVoiceCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedVoiceName: {
    color: '#3B82F6',
  },
  voiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  selectedVoiceDescription: {
    color: '#1D4ED8',
  },
  languageList: {
    marginTop: 16,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLanguageItem: {
    backgroundColor: '#EFF6FF',
  },
  languageName: {
    fontSize: 16,
    color: '#111827',
  },
  selectedLanguageName: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 12,
  },
});