import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Mic, Brain, MessageCircle, Settings, Play, Square, ChefHat, Volume2, VolumeX } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useChefAssistantStore } from "@/stores/chefAssistantStore";
import BackButton from "@/components/BackButton";
import GradientText from "@/components/GradientText";
import ChatMessage from "@/components/chef-assistant/ChatMessage";
import MultimodalChatInput from "@/components/chef-assistant/MultimodalChatInput";
import EnhancedCameraView from "@/components/chef-assistant/EnhancedCameraView";
import { TTSPlayer } from "@/components/TTSPlayer";
import { useTTS } from "@/hooks/useTTS";

export default function AssistantScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showTTSDemo, setShowTTSDemo] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  
  // TTS for assistant responses
  const { speak, stop, isSpeaking } = useTTS({
    lowLatency: true,
    rate: 1.0,
    pitch: 1.0,
    language: 'en-US',
  });

  const {
    currentSession,
    isSessionActive,
    messages,
    isTyping,
    selectedAgent,
    availableAgents,
    startSession,
    endSession,
    sendMessage,
    selectAgent,
    initializeStore,
  } = useChefAssistantStore();

  // Initialize store on mount
  useEffect(() => {
    initializeStore();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleStartSession = () => {
    Alert.prompt(
      "Start Cooking Session",
      "What are you cooking today?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: (recipeName) => {
            if (recipeName?.trim()) {
              startSession(recipeName.trim());
            }
          },
        },
      ],
      "plain-text",
      "e.g., Jollof Rice, Egusi Soup..."
    );
  };

  const handleEndSession = () => {
    Alert.alert(
      "End Session",
      "Are you sure you want to end this cooking session?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Session", style: "destructive", onPress: endSession },
      ]
    );
  };

  const handleCameraCapture = async (imageUri: string) => {
    setShowCamera(false);
    await sendMessage("Please analyze this cooking image", imageUri);
  };

  const handleAgentSelect = (agent: any) => {
    selectAgent(agent);
    setShowAgentSelector(false);
  };

  const handleGoToChat = () => {
    if (isSessionActive) {
      router.push('/chef-assistant/chat');
    }
  };

  const handleTTSToggle = () => {
    if (isSpeaking) {
      stop();
    }
    setTtsEnabled(!ttsEnabled);
  };

  const speakLastMessage = () => {
    const lastAssistantMessage = messages
      .filter(msg => msg.role === 'assistant')
      .pop();
    
    if (lastAssistantMessage && ttsEnabled) {
      speak(lastAssistantMessage.content);
    }
  };

  // Auto-speak new assistant messages
  useEffect(() => {
    if (ttsEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        // Small delay to ensure message is rendered
        setTimeout(() => {
          speak(lastMessage.content);
        }, 500);
      }
    }
  }, [messages.length, ttsEnabled]);

  if (showCamera) {
    return (
      <EnhancedCameraView
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.titleContainer}>
            <GradientText
              colors={["#EF4444", "#F59E0B", "#3B82F6"]}
              style={styles.title}
            >
              MANU ASSIST
            </GradientText>
            {currentSession && (
              <Text style={[styles.sessionTitle, { color: colors.muted }]}>
                {currentSession.recipeName}
              </Text>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleTTSToggle}>
              <View style={[styles.headerButton, { 
                backgroundColor: ttsEnabled ? '#10B981' : '#EF4444', 
                borderColor: colors.iconBorder 
              }]}>
                {isSpeaking ? (
                  <Volume2 size={18} color="black" />
                ) : ttsEnabled ? (
                  <Volume2 size={18} color="black" />
                ) : (
                  <VolumeX size={18} color="black" />
                )}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/tts-demo')}>
              <View style={[styles.headerButton, { backgroundColor: '#FACC15', borderColor: colors.iconBorder }]}>
                <Mic size={18} color="black" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowAgentSelector(!showAgentSelector)}>
              <View style={[styles.headerButton, { backgroundColor: '#8B5CF6', borderColor: colors.iconBorder }]}>
                <Brain size={18} color="black" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* TTS Demo */}
        {showTTSDemo && (
          <View style={styles.ttsDemo}>
            <TTSPlayer
              initialText="Welcome to your cooking assistant! I'm here to help you create amazing dishes with step-by-step guidance and real-time tips."
              showControls={true}
              showSettings={true}
              lowLatency={true}
            />
          </View>
        )}

        {/* Agent Selector */}
        {showAgentSelector && (
          <View style={[styles.agentSelector, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.agentSelectorTitle, { color: colors.text }]}>Choose Your Chef Assistant</Text>
            {availableAgents.map((agent) => (
              <TouchableOpacity
                key={agent.id}
                style={[
                  styles.agentOption,
                  selectedAgent?.id === agent.id && styles.selectedAgent,
                  { borderColor: colors.border }
                ]}
                onPress={() => handleAgentSelect(agent)}
              >
                <Text style={styles.agentEmoji}>👨‍🍳</Text>
                <View style={styles.agentInfo}>
                  <Text style={[styles.agentName, { color: colors.text }]}>{agent.name}</Text>
                  <Text style={[styles.agentSpecialty, { color: colors.muted }]}>{agent.specialty}</Text>
                </View>
                {selectedAgent?.id === agent.id && (
                  <View style={[styles.selectedIndicator, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Session Controls */}
        <View style={styles.sessionControls}>
          {!isSessionActive ? (
            <TouchableOpacity style={styles.sessionButtonContainer} onPress={handleStartSession}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.sessionButton}
              >
                <View style={[styles.sessionIconContainer, { backgroundColor: '#FACC15', borderColor: colors.iconBorder }]}>
                  <Play size={16} color="black" />
                </View>
                <Text style={styles.sessionButtonText}>Start Cooking Session</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeSessionContainer}>
              <TouchableOpacity style={styles.sessionButtonContainer} onPress={handleEndSession}>
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  style={styles.sessionButton}
                >
                  <View style={[styles.sessionIconContainer, { backgroundColor: 'white', borderColor: colors.iconBorder }]}>
                    <Square size={16} color="black" />
                  </View>
                  <Text style={styles.sessionButtonText}>End Session</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cameraButtonContainer}
                onPress={() => setShowCamera(true)}
              >
                <View style={[styles.cameraButton, { backgroundColor: '#3B82F6', borderColor: colors.iconBorder }]}>
                  <Camera size={20} color="black" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.chatButtonContainer}
                onPress={handleGoToChat}
              >
                <View style={[styles.chatButton, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
                  <MessageCircle size={20} color="black" />
                </View>
              </TouchableOpacity>
              
              {messages.length > 0 && (
                <TouchableOpacity 
                  style={styles.speakButtonContainer}
                  onPress={speakLastMessage}
                  disabled={!ttsEnabled}
                >
                  <View style={[styles.speakButton, { 
                    backgroundColor: ttsEnabled ? '#F59E0B' : '#9CA3AF', 
                    borderColor: colors.iconBorder 
                  }]}>
                    {isSpeaking ? (
                      <Volume2 size={20} color="black" />
                    ) : (
                      <Volume2 size={20} color="black" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Quick Chat Preview */}
        {isSessionActive && messages.length > 0 && (
          <View style={styles.quickChatPreview}>
            <TouchableOpacity 
              style={[styles.chatPreviewContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={handleGoToChat}
            >
              <Text style={[styles.chatPreviewTitle, { color: colors.text }]}>Recent Messages</Text>
              <ScrollView
                ref={scrollViewRef}
                style={styles.previewMessages}
                showsVerticalScrollIndicator={false}
              >
                {messages.slice(-3).map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onImagePress={(imageUri) => console.log('Image pressed:', imageUri)}
                  />
                ))}
                
                {isTyping && (
                  <View style={styles.typingContainer}>
                    <View style={[styles.typingBubble, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                      <Text style={[styles.typingText, { color: colors.muted }]}>
                        {selectedAgent?.name} is thinking...
                      </Text>
                      <View style={styles.typingDots}>
                        <View style={[styles.dot, { backgroundColor: colors.muted }]} />
                        <View style={[styles.dot, { backgroundColor: colors.muted }]} />
                        <View style={[styles.dot, { backgroundColor: colors.muted }]} />
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.chatPreviewFooter}>
                <Text style={[styles.tapToContinue, { color: colors.muted }]}>
                  Tap to open full chat
                </Text>
                <MessageCircle size={16} color={colors.muted} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Welcome Screen */}
        {!isSessionActive && (
          <ScrollView style={styles.welcomeContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeContent}>
              <View style={styles.welcomeHeader}>
                <Text style={styles.welcomeEmoji}>👨‍🍳</Text>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                  Meet {selectedAgent?.name}
                </Text>
                <Text style={[styles.welcomeDescription, { color: colors.muted }]}>
                  {selectedAgent?.description}
                </Text>
              </View>

              <View style={[styles.featuresGrid, { borderColor: colors.border }]}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={[styles.featureIcon, { backgroundColor: '#3B82F6' }]}>
                      <Camera size={20} color="black" />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>Real-time Analysis</Text>
                    <Text style={[styles.featureDescription, { color: colors.muted }]}>
                      Show me your ingredients and cooking progress
                    </Text>
                  </View>

                  <View style={[styles.featureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={[styles.featureIcon, { backgroundColor: '#10B981' }]}>
                      <Mic size={20} color="black" />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>Voice Commands</Text>
                    <Text style={[styles.featureDescription, { color: colors.muted }]}>
                      Hands-free cooking guidance
                    </Text>
                  </View>
                </View>

                <View style={styles.featureRow}>
                  <View style={[styles.featureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={[styles.featureIcon, { backgroundColor: '#FACC15' }]}>
                      <Brain size={20} color="black" />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>Smart Tips</Text>
                    <Text style={[styles.featureDescription, { color: colors.muted }]}>
                      Personalized cooking advice
                    </Text>
                  </View>

                  <View style={[styles.featureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={[styles.featureIcon, { backgroundColor: '#8B5CF6' }]}>
                      <ChefHat size={20} color="black" />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>Step-by-Step</Text>
                    <Text style={[styles.featureDescription, { color: colors.muted }]}>
                      Guided cooking instructions
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Quick Chat Input */}
        {isSessionActive && (
          <MultimodalChatInput
            onSendMessage={sendMessage}
            disabled={isTyping}
          />
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: 'center',
  },
  sessionTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  ttsDemo: {
    marginHorizontal: 0,
    marginBottom: 8,
  },
  agentSelector: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  agentSelectorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  agentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedAgent: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  agentEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  agentSpecialty: {
    fontSize: 14,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionControls: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sessionButtonContainer: {
    borderRadius: 16,
    flex: 1,
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
  },
  sessionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  sessionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: 'white',
  },
  activeSessionContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cameraButtonContainer: {
    borderRadius: 16,
  },
  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  chatButtonContainer: {
    borderRadius: 16,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  speakButtonContainer: {
    borderRadius: 16,
  },
  speakButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quickChatPreview: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chatPreviewContainer: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  chatPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  previewMessages: {
    flex: 1,
    maxHeight: 200,
  },
  chatPreviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 8,
  },
  tapToContinue: {
    fontSize: 14,
    fontWeight: '500',
  },
  typingContainer: {
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  typingText: {
    fontSize: 14,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    padding: 16,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresGrid: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  featureCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});