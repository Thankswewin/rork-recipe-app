import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch
} from 'react-native';
import { ChevronRight, Volume2, Mic, Globe, X } from 'lucide-react-native';
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

  const selectedVoiceData = KYUTAI_VOICES.find((v) => v.id === selectedVoice);
  const selectedLanguageData = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Voice Settings</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Customize your Kyutai voice experience
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Voice Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Volume2 size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Voice Style</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Choose from Kyutai's natural-sounding AI voices
          </Text>

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
                <View style={styles.voiceCardContent}>
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
                </View>
                {selectedVoice === voice.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
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
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Selected Language</Text>
              <Text style={styles.settingValue}>
                {selectedLanguageData?.name}
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

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
                  <View style={styles.languageCheckmark} />
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
            Experience natural, human-like conversations with Kyutai's advanced neural 
            text-to-speech technology. Our AI delivers ultra-low latency voice synthesis 
            optimized for real-time interactions.
          </Text>
          <Text style={styles.aboutText}>
            Features include real-time speech recognition, natural language processing, 
            and high-quality voice synthesis that adapts to conversational context.
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
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
    gap: 12,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  selectedVoiceCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  voiceCardContent: {
    flex: 1,
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
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  languageList: {
    marginTop: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
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
  languageCheckmark: {
    width: 6,
    height: 6,
    borderRadius: 3,
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