import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Linking
} from 'react-native';
import {
  Server,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Zap,
  Globe
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUnmuteStore } from '@/stores/unmuteStore';
import * as Clipboard from 'expo-clipboard';

interface RunPodSetupHelperProps {
  onClose?: () => void;
}

export const RunPodSetupHelper: React.FC<RunPodSetupHelperProps> = ({ onClose }) => {
  const { setServerUrl, addDebugLog } = useUnmuteStore();
  const [podId, setPodId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedOption, setSelectedOption] = useState<'runpod' | 'custom' | 'local'>('runpod');

  const generateRunPodUrl = (id: string) => {
    if (!id.trim()) return '';
    return `ws://${id.trim()}-8000.proxy.runpod.net/ws`;
  };

  const handleSetUrl = () => {
    let url = '';
    
    switch (selectedOption) {
      case 'runpod':
        if (!podId.trim()) {
          Alert.alert('Missing Pod ID', 'Please enter your RunPod instance ID');
          return;
        }
        url = generateRunPodUrl(podId);
        break;
      case 'custom':
        if (!customUrl.trim()) {
          Alert.alert('Missing URL', 'Please enter your custom server URL');
          return;
        }
        url = customUrl.trim();
        break;
      case 'local':
        url = 'ws://localhost:8000/ws';
        break;
    }

    setServerUrl(url);
    addDebugLog({
      level: 'success',
      message: `Server URL set to: ${url}`
    });

    Alert.alert(
      'URL Updated',
      `Server URL has been set to:\n${url}\n\nYou can now try connecting to your Unmute server.`,
      [
        { text: 'OK', onPress: onClose }
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'URL copied to clipboard');
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Server size={24} color="#8B5CF6" />
          <Text style={styles.title}>RunPod Setup Helper</Text>
        </View>
        <Text style={styles.subtitle}>
          Configure your Unmute server connection
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Setup Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Setup</Text>
          
          {/* RunPod Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'runpod' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedOption('runpod')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionTitleRow}>
                <Zap size={20} color={selectedOption === 'runpod' ? '#8B5CF6' : '#6B7280'} />
                <Text style={[
                  styles.optionTitle,
                  selectedOption === 'runpod' && styles.optionTitleSelected
                ]}>
                  RunPod Instance
                </Text>
              </View>
              {selectedOption === 'runpod' && (
                <CheckCircle size={20} color="#10B981" />
              )}
            </View>
            <Text style={styles.optionDescription}>
              Connect to your RunPod GPU instance running Unmute
            </Text>
            
            {selectedOption === 'runpod' && (
              <View style={styles.optionContent}>
                <Text style={styles.inputLabel}>RunPod Instance ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={podId}
                  onChangeText={setPodId}
                  placeholder="e.g., abc123def456"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.inputHint}>
                  Find this in your RunPod dashboard URL or instance name
                </Text>
                
                {podId.trim() && (
                  <View style={styles.generatedUrl}>
                    <Text style={styles.generatedUrlLabel}>Generated URL:</Text>
                    <View style={styles.urlRow}>
                      <Text style={styles.generatedUrlText}>
                        {generateRunPodUrl(podId)}
                      </Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => copyToClipboard(generateRunPodUrl(podId))}
                      >
                        <Copy size={16} color="#8B5CF6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Custom URL Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'custom' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedOption('custom')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionTitleRow}>
                <Globe size={20} color={selectedOption === 'custom' ? '#8B5CF6' : '#6B7280'} />
                <Text style={[
                  styles.optionTitle,
                  selectedOption === 'custom' && styles.optionTitleSelected
                ]}>
                  Custom Server
                </Text>
              </View>
              {selectedOption === 'custom' && (
                <CheckCircle size={20} color="#10B981" />
              )}
            </View>
            <Text style={styles.optionDescription}>
              Connect to a custom Unmute server or different hosting provider
            </Text>
            
            {selectedOption === 'custom' && (
              <View style={styles.optionContent}>
                <Text style={styles.inputLabel}>Server WebSocket URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={customUrl}
                  onChangeText={setCustomUrl}
                  placeholder="ws://your-server.com:8000/ws"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.inputHint}>
                  Enter the full WebSocket URL of your Unmute server
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Local Development Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'local' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedOption('local')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionTitleRow}>
                <Server size={20} color={selectedOption === 'local' ? '#8B5CF6' : '#6B7280'} />
                <Text style={[
                  styles.optionTitle,
                  selectedOption === 'local' && styles.optionTitleSelected
                ]}>
                  Local Development
                </Text>
              </View>
              {selectedOption === 'local' && (
                <CheckCircle size={20} color="#10B981" />
              )}
            </View>
            <Text style={styles.optionDescription}>
              Connect to Unmute running locally on your development machine
            </Text>
            
            {selectedOption === 'local' && (
              <View style={styles.optionContent}>
                <View style={styles.localInfo}>
                  <Text style={styles.localInfoText}>
                    URL: ws://localhost:8000/ws
                  </Text>
                  <Text style={styles.inputHint}>
                    Make sure Unmute is running locally with Docker Compose
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Setup Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help Setting Up?</Text>
          
          <View style={styles.helpCard}>
            <AlertCircle size={20} color="#F59E0B" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>RunPod Setup Guide</Text>
              <Text style={styles.helpText}>
                Follow our comprehensive guide to set up Unmute on RunPod with GPU support.
              </Text>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => openLink('https://github.com/kyutai-labs/unmute')}
              >
                <ExternalLink size={16} color="#8B5CF6" />
                <Text style={styles.helpButtonText}>View Setup Guide</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Common URLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common URL Formats</Text>
          
          <View style={styles.urlExamples}>
            <View style={styles.urlExample}>
              <Text style={styles.urlExampleLabel}>RunPod:</Text>
              <Text style={styles.urlExampleText}>ws://pod-id-8000.proxy.runpod.net/ws</Text>
            </View>
            <View style={styles.urlExample}>
              <Text style={styles.urlExampleLabel}>Local:</Text>
              <Text style={styles.urlExampleText}>ws://localhost:8000/ws</Text>
            </View>
            <View style={styles.urlExample}>
              <Text style={styles.urlExampleLabel}>Custom:</Text>
              <Text style={styles.urlExampleText}>ws://your-domain.com:80/ws</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.setUrlButtonContainer} onPress={handleSetUrl}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.setUrlButton}
          >
            <CheckCircle size={18} color="#FFFFFF" />
            <Text style={styles.setUrlButtonText}>Set Server URL</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F8FAFC',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  optionTitleSelected: {
    color: '#8B5CF6',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  optionContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  generatedUrl: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  generatedUrlLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 4,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generatedUrlText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  localInfo: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  localInfoText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
    marginBottom: 4,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500' as const,
  },
  urlExamples: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  urlExample: {
    marginBottom: 8,
  },
  urlExampleLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 2,
  },
  urlExampleText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
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
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  setUrlButtonContainer: {
    flex: 1,
    borderRadius: 12,
  },
  setUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  setUrlButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});