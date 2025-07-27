import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import { useTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  MessageCircle,
  Camera as CameraIcon,
  Mic,
  Settings,
  Plus,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Import new chat components
import { ChatInterface } from '../../components/chat/ChatInterface';
import { ChefSelector } from '../../components/chef/ChefSelector';
import { VoiceRecorder } from '../../components/voice/VoiceRecorder';
import { CameraCapture } from '../../components/camera/CameraCapture';

export default function AssistantScreen() {
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showChefSelector, setShowChefSelector] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCameraPress = () => {
    setShowCameraCapture(true);
  };

  const handleVoicePress = () => {
    setShowVoiceRecorder(true);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Requesting camera permission...
        </Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          No access to camera. Please enable camera permissions in settings.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      
      {/* Main Chat Interface */}
      <ChatInterface />

      {/* Modals */}
      <ChefSelector
        visible={showChefSelector}
        onSelect={(chef) => {
          setShowChefSelector(false);
          // Handle chef selection
        }}
        onClose={() => setShowChefSelector(false)}
      />

      <Modal
        visible={showVoiceRecorder}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <VoiceRecorder
          onRecordingComplete={(audioUri, duration) => {
            setShowVoiceRecorder(false);
            // Handle voice recording
          }}
        />
      </Modal>

      <CameraCapture
        visible={showCameraCapture}
        onCapture={(imageUri, analysis) => {
          setShowCameraCapture(false);
          // Handle camera capture
        }}
        onClose={() => setShowCameraCapture(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});