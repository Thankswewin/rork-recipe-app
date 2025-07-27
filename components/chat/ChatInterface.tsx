import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Camera,
  Mic,
  MicOff,
  Send,
  Image as ImageIcon,
  Video,
  X,
  RotateCcw,
  Settings,
  Zap,
  ChefHat,
  MessageCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useVoiceChatStore } from '../../stores/voiceChatStore';
import { useTheme } from '../../hooks/useTheme';
import { MessageBubble } from './MessageBubble';
import { MultimodalInput } from './MultimodalInput';
import { ChefSelector } from '../chef/ChefSelector';
// RealTimeAnalysis component not available
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { CameraCapture } from '../camera/CameraCapture';
import { AIResponseGenerator, useAIResponseGenerator } from '../ai/AIResponseGenerator';
import { useChatStore, Chef, Message } from '../../stores/chatStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types are now imported from the store

interface ChatInterfaceProps {
  chatSessionId?: string;
  selectedChefId?: string;
  onChefChange?: (chefId: string) => void;
}

export function ChatInterface({
  chatSessionId,
  selectedChefId,
  onChefChange,
}: ChatInterfaceProps) {
  const { colors } = useTheme();
  const [showCamera, setShowCamera] = useState(false);
  const [showChefSelector, setShowChefSelector] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceRecorderVisible, setVoiceRecorderVisible] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [pendingImageAnalysis, setPendingImageAnalysis] = useState<string | null>(null);
  
  // Use chat store
  const {
    currentSession,
    currentChef,
    isGeneratingResponse,
    isRecording,
    addMessage,
    setCurrentChef,
    createNewSession,
    setGeneratingResponse,
    setRecording,
  } = useChatStore();

  // AI Response Generator
  const {
    generateResponse,
    isGenerating,
    isGeneratingVoice,
    error: aiError,
    clearError,
  } = useAIResponseGenerator({
    chef: currentChef,
    messages: currentSession?.messages || [],
    enableVoice: isVoiceEnabled,
  });
  
  const cameraRef = useRef<CameraView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const {
    isConnected,
    isConnecting,
    isRecording: voiceIsRecording,
    connect,
    disconnect,
    startRecording,
    stopRecording,
  } = useVoiceChatStore();

  // Pulse animation for recording state
  useEffect(() => {
    if (voiceIsRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [voiceIsRecording]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (currentSession?.messages.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentSession?.messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (!currentSession || currentSession.messages.length === 0) {
      addMessage({
        content: `Hello! I'm ${currentChef.name}, your AI cooking assistant. I can help you with recipes, cooking techniques, and ingredient analysis. Feel free to speak to me, show me ingredients through the camera, or type your questions!`,
        type: 'text',
        sender: 'ai',
      });
    }
  }, [currentChef.name, currentSession, addMessage]);

  const handleCameraToggle = useCallback(() => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setShowCamera(!showCamera);
  }, [permission, showCamera, requestPermission]);

  const handleMicToggle = useCallback(async () => {
    try {
      if (!isConnected) {
        await connect();
      }
      
      if (voiceIsRecording) {
        stopRecording();
      } else {
        await startRecording();
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
      Alert.alert('Voice Error', 'Failed to toggle voice recording');
    }
  }, [isConnected, voiceIsRecording, connect, startRecording, stopRecording]);

  const toggleCameraFacing = useCallback(() => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    
    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        // Add user message with image
        addMessage({
          content: photo.uri,
          type: 'image',
          sender: 'user',
        });
        
        // Generate AI response for image
        setGeneratingResponse(true);
        try {
          const { text: aiResponseText } = await generateResponse(
            'Please analyze this image',
            photo.uri
          );
          
          addMessage({
            content: aiResponseText,
            type: 'text',
            sender: 'ai',
          });
        } catch (error) {
          console.error('Failed to analyze image:', error);
          Alert.alert('Error', 'Failed to analyze image. Please try again.');
        } finally {
          setGeneratingResponse(false);
        }
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Camera Error', 'Failed to capture image');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    addMessage({
      content: text,
      type: 'text',
      sender: 'user',
    });
    
    try {
      // Generate AI response
      setGeneratingResponse(true);
      const { text: aiResponseText, audioUri } = await generateResponse(
        text,
        pendingImageAnalysis
      );

      addMessage({
        content: aiResponseText,
        type: audioUri ? 'voice' : 'text',
        sender: 'ai',
        metadata: audioUri ? { audioUrl: audioUri } : undefined,
      });

      // Clear pending image analysis
      setPendingImageAnalysis(null);

    } catch (error: any) {
      console.error('Failed to generate AI response:', error);
      Alert.alert('Error', 'Failed to get response from AI chef. Please try again.');
    } finally {
      setGeneratingResponse(false);
    }
  }, [generateResponse, pendingImageAnalysis, addMessage, setGeneratingResponse]);

  const handleVoiceMessage = useCallback(async (transcript: string, audioUrl: string) => {
    // Add user message
    addMessage({
      content: transcript,
      type: 'voice',
      sender: 'user',
      metadata: { audioUrl },
    });
    
    try {
      // Generate AI response
      setGeneratingResponse(true);
      const { text: aiResponseText, audioUri } = await generateResponse(
        transcript,
        pendingImageAnalysis
      );

      addMessage({
        content: aiResponseText,
        type: audioUri ? 'voice' : 'text',
        sender: 'ai',
        metadata: audioUri ? { audioUrl: audioUri } : undefined,
      });

      // Clear pending image analysis
      setPendingImageAnalysis(null);

    } catch (error: any) {
      console.error('Failed to generate AI response:', error);
      Alert.alert('Error', 'Failed to get response from AI chef. Please try again.');
    } finally {
      setGeneratingResponse(false);
    }
  }, [generateResponse, pendingImageAnalysis, addMessage, setGeneratingResponse]);

  const handleChefSelect = useCallback((chef: Chef) => {
    setCurrentChef(chef);
    setShowChefSelector(false);
    onChefChange?.(chef.id);
    
    // Add chef change message
    addMessage({
      content: `Hi! I'm ${chef.name}. ${chef.description} What would you like to cook today?`,
      type: 'text',
      sender: 'ai',
    });
  }, [onChefChange]);

  const handleVoiceRecording = useCallback((audioUri: string, duration: number) => {
    // For voice recordings, we'll need transcription
    setVoiceRecorderVisible(false);
    // This would typically involve sending to transcription service
    handleVoiceMessage('Voice message recorded', audioUri);
  }, [handleVoiceMessage]);

  const handleCameraCapture = useCallback((imageUri: string, analysis?: string) => {
    if (analysis) {
      setPendingImageAnalysis(analysis);
    }
    
    addMessage({
      content: imageUri,
      type: 'image',
      sender: 'user',
      metadata: { analysis },
    });
    
    setShowCamera(false);
    
    // Trigger AI analysis
    sendTextMessage('Please analyze this image');
  }, [sendTextMessage, addMessage]);

  const startNewChat = useCallback(() => {
    createNewSession();
  }, [createNewSession]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.chefInfo}
          onPress={() => setShowChefSelector(true)}
        >
          <Text style={styles.chefAvatar}>{currentChef.avatar}</Text>
          <View>
            <Text style={styles.chefName}>{currentChef.name}</Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { 
                backgroundColor: isConnected ? '#10B981' : '#6B7280' 
              }]} />
              <Text style={styles.statusText}>
                {isConnected ? 'Connected • Real-time AI' : 'Tap mic to connect'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsVoiceEnabled(!isVoiceEnabled)}
          >
            {isVoiceEnabled ? (
              <Mic size={20} color="#3B82F6" />
            ) : (
              <MicOff size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={startNewChat}
          >
            <MessageCircle size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleCameraToggle}
          >
            <Camera size={24} color={showCamera ? '#3B82F6' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera View */}
      {showCamera && permission?.granted && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraTopControls}>
                <TouchableOpacity 
                  style={styles.cameraControlButton}
                  onPress={() => setShowCamera(false)}
                >
                  <X size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cameraControlButton}
                  onPress={toggleCameraFacing}
                >
                  <RotateCcw size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.cameraBottomControls}>
                <TouchableOpacity 
                  style={[styles.captureButton, isAnalyzing && styles.captureButtonDisabled]}
                  onPress={takePicture}
                  disabled={isAnalyzing}
                >
                  <LinearGradient
                    colors={isAnalyzing ? ['#6B7280', '#4B5563'] : ['#EF4444', '#DC2626']}
                    style={styles.captureButtonGradient}
                  >
                    <Camera size={28} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              {/* Real-time Analysis Overlay - Component not available */}
            </View>
          </CameraView>
        </View>
      )}
      
      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={[styles.messagesContainer, showCamera && styles.messagesContainerWithCamera]}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {!currentSession || currentSession.messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.chefAvatarLarge}>{currentChef.avatar}</Text>
            <Text style={styles.emptyStateTitle}>Welcome to {currentChef.name}!</Text>
            <Text style={styles.emptyStateText}>
              {currentChef.description}
            </Text>
            <View style={styles.specialtiesContainer}>
              {currentChef.specialties.slice(0, 3).map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          currentSession.messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message}
            />
          ))
        )}
        
        {(isGenerating || isGeneratingVoice) && (
          <View style={styles.typingIndicator}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              style={styles.typingBubble}
            >
              <Text style={styles.typingAvatar}>{currentChef.avatar}</Text>
              <View style={styles.typingContent}>
                <Text style={styles.typingText}>
                  {isGeneratingVoice ? 'Preparing voice response...' : `${currentChef.name} is thinking...`}
                </Text>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
      
      {/* Input Controls */}
      <MultimodalInput
        onSendMessage={(content, type, metadata) => {
          if (type === 'voice') {
            handleVoiceMessage(content, metadata?.audioUrl || '');
          } else {
            sendTextMessage(content);
          }
        }}
        onCameraPress={handleCameraToggle}
        onVoicePress={() => setVoiceRecorderVisible(true)}
        disabled={isGenerating || isGeneratingVoice}
      />
      
      {/* Modals */}
      <ChefSelector
        visible={showChefSelector}
        onClose={() => setShowChefSelector(false)}
        onSelect={handleChefSelect}
        currentChefId={currentChef.id}
      />
      
      <CameraCapture
        visible={showCamera && !showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
        enableRealTimeAnalysis={true}
        mode="photo"
      />
      
      {voiceRecorderVisible && (
        <View style={styles.voiceRecorderModal}>
          <View style={styles.voiceRecorderContainer}>
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecording}
              onTranscriptionComplete={(text) => {
                setVoiceRecorderVisible(false);
                sendTextMessage(text);
              }}
              enableTranscription={true}
              maxDuration={300}
            />
            <TouchableOpacity 
              style={styles.voiceRecorderClose}
              onPress={() => setVoiceRecorderVisible(false)}
            >
              <Text style={styles.voiceRecorderCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chefAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  chefName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  chefAvatarLarge: {
    fontSize: 64,
    marginBottom: 16,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  specialtyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#374151',
    marginHorizontal: 4,
    marginVertical: 2,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  typingAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  typingContent: {
    flex: 1,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 4,
  },
  voiceRecorderModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceRecorderContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#111827',
    minWidth: screenWidth * 0.8,
  },
  voiceRecorderClose: {
    marginTop: 16,
    alignItems: 'center',
  },
  voiceRecorderCloseText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  cameraContainer: {
    height: 200,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cameraControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  messagesContainerWithCamera: {
    flex: 0.6,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    minHeight: 300,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});