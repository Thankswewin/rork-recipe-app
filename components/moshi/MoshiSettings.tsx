import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert
} from 'react-native';
import {
  X,
  Server,
  Mic,
  Volume2,
  Settings as SettingsIcon,
  Info,
  Save,
  RotateCcw
} from 'lucide-react-native';
import { useMoshiStore } from '@/stores/moshiStore';
import { MOSHI_SAMPLE_RATES, MOSHI_CHANNELS, MOSHI_BIT_DEPTHS } from '@/lib/moshi-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  spacing,
  typography,
  borderRadius,
  colorPalette,
} from '@/constants/designSystem';

interface MoshiSettingsProps {
  onClose: () => void;
}

export const MoshiSettings: React.FC<MoshiSettingsProps> = ({ onClose }) => {
  const {
    serverUrl,
    sampleRate,
    channels,
    bitDepth,
    pushToTalk,
    isConnected,
    setServerUrl,
    setSampleRate,
    setChannels,
    setBitDepth,
    setPushToTalk,
    clearMessages,
    clearDebugLogs,
    disconnect
  } = useMoshiStore();

  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  const [localSampleRate, setLocalSampleRate] = useState(sampleRate);
  const [localChannels, setLocalChannels] = useState(channels);
  const [localBitDepth, setLocalBitDepth] = useState(bitDepth);
  const [localPushToTalk, setLocalPushToTalk] = useState(pushToTalk);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    if (isConnected && hasChanges) {
      Alert.alert(
        'Connection Active',
        'Changing settings will disconnect from Moshi. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            style: 'destructive',
            onPress: () => {
              disconnect();
              applySettings();
            }
          }
        ]
      );
    } else {
      applySettings();
    }
  };

  const applySettings = () => {
    setServerUrl(localServerUrl);
    setSampleRate(localSampleRate);
    setChannels(localChannels);
    setBitDepth(localBitDepth);
    setPushToTalk(localPushToTalk);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all Moshi settings to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setLocalServerUrl('https://9lwbtc0ch3pawy-8998.proxy.runpod.net');
            setLocalSampleRate(24000);
            setLocalChannels(1);
            setLocalBitDepth(16);
            setLocalPushToTalk(false);
            setHasChanges(true);
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'This will clear all messages and debug logs. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearMessages();
            clearDebugLogs();
          }
        }
      ]
    );
  };

  const updateHasChanges = () => {
    const changed = 
      localServerUrl !== serverUrl ||
      localSampleRate !== sampleRate ||
      localChannels !== channels ||
      localBitDepth !== bitDepth ||
      localPushToTalk !== pushToTalk;
    setHasChanges(changed);
  };

  React.useEffect(() => {
    updateHasChanges();
  }, [localServerUrl, localSampleRate, localChannels, localBitDepth, localPushToTalk]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SettingsIcon size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>Moshi Settings</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Settings */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Server size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Connection</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Server URL</Text>
            <Text style={styles.settingDescription}>
              Your RunPod Moshi server endpoint
            </Text>
            <Input
              value={localServerUrl}
              onChangeText={(text) => {
                setLocalServerUrl(text);
                updateHasChanges();
              }}
              placeholder="https://your-runpod-url.proxy.runpod.net"
              style={styles.input}
            />
          </View>

          {isConnected && (
            <View style={styles.connectionStatus}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>Currently connected to Moshi</Text>
            </View>
          )}
        </Card>

        {/* Audio Settings */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mic size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Audio Configuration</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Sample Rate</Text>
            <Text style={styles.settingDescription}>
              Audio quality setting (24 kHz recommended)
            </Text>
            <View style={styles.optionGrid}>
              {MOSHI_SAMPLE_RATES.map((rate) => (
                <TouchableOpacity
                  key={rate.value}
                  style={[
                    styles.optionButton,
                    localSampleRate === rate.value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setLocalSampleRate(rate.value);
                    updateHasChanges();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      localSampleRate === rate.value && styles.optionTextSelected
                    ]}
                  >
                    {rate.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Channels</Text>
            <Text style={styles.settingDescription}>
              Audio channel configuration
            </Text>
            <View style={styles.optionGrid}>
              {MOSHI_CHANNELS.map((channel) => (
                <TouchableOpacity
                  key={channel.value}
                  style={[
                    styles.optionButton,
                    localChannels === channel.value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setLocalChannels(channel.value);
                    updateHasChanges();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      localChannels === channel.value && styles.optionTextSelected
                    ]}
                  >
                    {channel.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Bit Depth</Text>
            <Text style={styles.settingDescription}>
              Audio precision setting
            </Text>
            <View style={styles.optionGrid}>
              {MOSHI_BIT_DEPTHS.map((depth) => (
                <TouchableOpacity
                  key={depth.value}
                  style={[
                    styles.optionButton,
                    localBitDepth === depth.value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setLocalBitDepth(depth.value);
                    updateHasChanges();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      localBitDepth === depth.value && styles.optionTextSelected
                    ]}
                  >
                    {depth.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Interaction Settings */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Volume2 size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Interaction</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <Text style={styles.settingLabel}>Push to Talk</Text>
                <Text style={styles.settingDescription}>
                  Hold microphone button to speak
                </Text>
              </View>
              <Switch
                value={localPushToTalk}
                onValueChange={(value) => {
                  setLocalPushToTalk(value);
                  updateHasChanges();
                }}
                trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                thumbColor={localPushToTalk ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={[styles.section, styles.infoCard]}>
          <View style={styles.sectionHeader}>
            <Info size={20} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: '#3B82F6' }]}>About Moshi</Text>
          </View>
          <Text style={styles.infoText}>
            Moshi is a speech-text foundation model that enables real-time voice conversations with AI. 
            It supports high-quality audio processing and natural conversation flow.
          </Text>
          <Text style={styles.infoText}>
            For best performance, use the recommended settings: 24 kHz sample rate, mono channel, and 16-bit depth.
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Clear Data"
            onPress={handleClearData}
            variant="outline"
            style={styles.actionButton}
            leftIcon={<X size={16} color="#EF4444" />}
          />
          <Button
            title="Reset to Defaults"
            onPress={handleReset}
            variant="outline"
            style={styles.actionButton}
            leftIcon={<RotateCcw size={16} color="#6B7280" />}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={onClose}
          variant="outline"
          style={styles.footerButton}
        />
        <Button
          title={hasChanges ? "Save Changes" : "Close"}
          onPress={hasChanges ? handleSave : onClose}
          style={[styles.footerButton, hasChanges && styles.saveButton]}
          leftIcon={hasChanges ? <Save size={16} color="#FFFFFF" /> : undefined}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.weights.bold,
    color: colorPalette.gray[900],
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  section: {
    marginVertical: spacing.md,
    padding: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.weights.semibold,
    color: colorPalette.gray[900],
  },
  settingItem: {
    marginBottom: spacing.xl,
  },
  settingLabel: {
    fontSize: typography.base,
    fontWeight: typography.weights.medium,
    color: colorPalette.gray[900],
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.sm,
    color: colorPalette.gray[600],
    marginBottom: spacing.md,
    lineHeight: typography.lineHeights.relaxed * typography.sm,
  },
  input: {
    marginTop: spacing.sm,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: typography.sm,
    color: '#065F46',
    fontWeight: typography.weights.medium,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colorPalette.gray[300],
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  optionText: {
    fontSize: typography.sm,
    color: colorPalette.gray[700],
    fontWeight: typography.weights.medium,
  },
  optionTextSelected: {
    color: '#8B5CF6',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    fontSize: typography.sm,
    color: '#1E40AF',
    lineHeight: typography.lineHeights.relaxed * typography.sm,
    marginBottom: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colorPalette.gray[200],
  },
  footerButton: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
  },
});