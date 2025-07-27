import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Platform, Modal, Animated } from "react-native";
import { Input } from "./ui/Input";
import { colors } from "@/constants/colors";
import { Send, Mic, Camera, Image as ImageIcon, X, StopCircle, MicOff, Volume2, VolumeX } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { startSpeechRecognition, speakText, stopSpeaking } from "@/utils/gemma";
import { useAppStore } from "@/store/appStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./ui/Text";
import { Button } from "@/components/ui/Button";
import {
  spacing,
  typography,
  borderRadius,
  colorPalette,
  shadows,
} from '@/constants/designSystem';

type MultimodalChatInputProps = {
  onSend: (message: string, image?: string) => void;
  onVoiceInput?: () => void;
  placeholder?: string;
  disabled?: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
};

export function MultimodalChatInput({
  onSend,
  onVoiceInput,
  placeholder = "Type a message...",
  disabled = false,
  showCancelButton = false,
  onCancel,
}: MultimodalChatInputProps) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<{ stop: () => void } | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [lastVoiceCommand, setLastVoiceCommand] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const preferences = useAppStore((state) => state.preferences);
  const voiceMode = useAppStore((state) => state.voiceMode);
  const setVoiceMode = useAppStore((state) => state.setVoiceMode);
  const isHandsFreeMode = useAppStore((state) => state.isHandsFreeMode);
  const setHandsFreeMode = useAppStore((state) => state.setHandsFreeMode);
  const collectUserData = useAppStore((state) => state.collectUserData);
  const insets = useSafeAreaInsets();
  
  // Animation for voice level indicator
  const voiceLevelAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  
  // Voice level animation
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        const newLevel = Math.random() * 0.8 + 0.2;
        setVoiceLevel(newLevel);
        
        Animated.timing(voiceLevelAnim, {
          toValue: newLevel,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }, 150);
      
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => {
        clearInterval(interval);
        pulseAnimation.stop();
      };
    } else {
      setVoiceLevel(0);
      voiceLevelAnim.setValue(0);
      micPulseAnim.setValue(1);
    }
  }, [isListening, voiceLevelAnim, micPulseAnim]);
  
  // Continuous listening for hands-free mode
  useEffect(() => {
    if (isHandsFreeMode && preferences.voiceEnabled && !isListening && Platform.OS === "web") {
      startContinuousListening();
    } else if (!isHandsFreeMode && isContinuousListening) {
      stopContinuousListening();
    }
  }, [isHandsFreeMode, preferences.voiceEnabled]);
  
  const handleSend = () => {
    if (message.trim() || image) {
      // Collect input data for AI training
      collectUserData({
        type: "user_input",
        inputType: image ? "multimodal" : "text",
        messageLength: message.length,
        hasImage: !!image,
        timestamp: Date.now(),
      });
      
      onSend(message.trim(), image || undefined);
      setMessage("");
      setImage(null);
      
      stopSpeaking();
    }
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    
    stopSpeaking();
  };
  
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setImage(`data:image/jpeg;base64,${asset.base64}`);
          
          // Collect image upload data
          collectUserData({
            type: "image_uploaded",
            source: "gallery",
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };
  
  const handleCameraCapture = async () => {
    if (Platform.OS === "web") {
      alert("Camera capture is not available on web. Please use the gallery option.");
      return;
    }
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        alert("Camera permission is required to capture images for MANU ASSIST");
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setImage(`data:image/jpeg;base64,${asset.base64}`);
          
          // Collect camera capture data
          collectUserData({
            type: "image_captured",
            source: "camera",
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("Error capturing image:", error);
    }
  };
  
  const startContinuousListening = () => {
    if (!preferences.voiceEnabled || Platform.OS !== "web") {
      setVoiceError("Voice recognition is only available on web browsers for MANU ASSIST");
      return;
    }
    
    setVoiceError(null);
    const language = preferences.language === "en" ? "en-NG" : preferences.language;
    
    const recognition = startSpeechRecognition(
      language,
      (text) => {
        setLastVoiceCommand(text);
        setIsProcessingVoice(true);
        setVoiceError(null);
        
        // Collect voice input data
        collectUserData({
          type: "voice_input",
          language,
          inputLength: text.length,
          mode: "continuous",
          timestamp: Date.now(),
        });
        
        setTimeout(() => {
          handleVoiceCommand(text);
          setIsProcessingVoice(false);
        }, 500);
      },
      (error) => {
        console.error("MANU ASSIST: Continuous speech recognition error:", error);
        setVoiceError(error);
        setIsProcessingVoice(false);
        
        if (preferences.voiceEnabled && voiceMode) {
          speakText("Sorry, I didn't catch that. Please try again.", language, 2);
        }
        
        if (error.includes("No speech detected") || error.includes("network")) {
          setTimeout(() => {
            if (isHandsFreeMode && Platform.OS === "web") {
              startContinuousListening();
            }
          }, 2000);
        }
      },
      true
    );
    
    setSpeechRecognition(recognition);
    setIsContinuousListening(true);
    setIsListening(true);
  };
  
  const stopContinuousListening = () => {
    if (speechRecognition) {
      speechRecognition.stop();
    }
    setSpeechRecognition(null);
    setIsContinuousListening(false);
    setIsListening(false);
    setIsProcessingVoice(false);
    setVoiceError(null);
  };
  
  const toggleVoiceInput = () => {
    if (Platform.OS !== "web") {
      setVoiceError("Voice recognition is only available on web browsers. Please use the web version of MANU ASSIST for voice features.");
      return;
    }
    
    setVoiceError(null);
    
    if (isListening && !isContinuousListening) {
      if (speechRecognition) {
        speechRecognition.stop();
      }
      setIsListening(false);
      setSpeechRecognition(null);
      setIsProcessingVoice(false);
    } else if (!isContinuousListening) {
      const language = preferences.language === "en" ? "en-NG" : preferences.language;
      
      const recognition = startSpeechRecognition(
        language,
        (text) => {
          setMessage(prev => prev + " " + text);
          setLastVoiceCommand(text);
          setIsProcessingVoice(false);
          setVoiceError(null);
          
          // Collect voice input data
          collectUserData({
            type: "voice_input",
            language,
            inputLength: text.length,
            mode: "manual",
            timestamp: Date.now(),
          });
          
          if (preferences.voiceEnabled && voiceMode) {
            speakText("Voice input received", language, 1);
          }
        },
        (error) => {
          console.error("MANU ASSIST: Speech recognition error:", error);
          setVoiceError(error);
          setIsListening(false);
          setSpeechRecognition(null);
          setIsProcessingVoice(false);
          
          if (preferences.voiceEnabled && voiceMode) {
            speakText("Voice input failed. Please try again.", language, 2);
          }
        }
      );
      
      setSpeechRecognition(recognition);
      setIsListening(true);
      setIsProcessingVoice(true);
      
      if (preferences.voiceEnabled && voiceMode) {
        speakText("MANU ASSIST is listening for your voice input", language, 1);
      }
    }
  };
  
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    const language = preferences.language === "en" ? "en-NG" : preferences.language;
    
    // Wake word detection
    if (lowerCommand.includes("hey manu") || lowerCommand.includes("manu assist")) {
      if (preferences.voiceEnabled && voiceMode) {
        speakText("Yes, I'm MANU ASSIST. How can I help you cook today?", language, 3);
      }
      return;
    }
    
    // Send message commands
    if (lowerCommand.includes("send message") || lowerCommand.includes("send that")) {
      if (message.trim()) {
        handleSend();
        if (preferences.voiceEnabled && voiceMode) {
          speakText("Message sent to MANU ASSIST", language, 2);
        }
      } else {
        if (preferences.voiceEnabled && voiceMode) {
          speakText("No message to send", language, 2);
        }
      }
      return;
    }
    
    // Clear message commands
    if (lowerCommand.includes("clear message") || lowerCommand.includes("delete message")) {
      setMessage("");
      if (preferences.voiceEnabled && voiceMode) {
        speakText("Message cleared", language, 2);
      }
      return;
    }
    
    // Stop talking command
    if (lowerCommand.includes("stop talking") || lowerCommand.includes("be quiet")) {
      stopSpeaking();
      return;
    }
    
    // Repeat command
    if (lowerCommand.includes("repeat that") || lowerCommand.includes("say again")) {
      if (lastVoiceCommand) {
        if (preferences.voiceEnabled && voiceMode) {
          speakText(lastVoiceCommand, language, 2);
        }
      }
      return;
    }
    
    // Voice mode toggle commands
    if (lowerCommand.includes("enable voice") || lowerCommand.includes("turn on voice")) {
      setVoiceMode(true);
      speakText("MANU ASSIST voice mode enabled", language, 3);
      return;
    }
    
    if (lowerCommand.includes("disable voice") || lowerCommand.includes("turn off voice")) {
      speakText("MANU ASSIST voice mode disabled", language, 3);
      setVoiceMode(false);
      return;
    }
    
    // Regular message handling
    if (isHandsFreeMode) {
      onSend(command);
      if (preferences.voiceEnabled && voiceMode) {
        speakText("Processing your cooking request", language, 1);
      }
    } else {
      setMessage(prev => prev + " " + command);
      if (preferences.voiceEnabled && voiceMode) {
        speakText("Voice input added to message", language, 1);
      }
    }
  };
  
  const toggleHandsFreeMode = () => {
    const newMode = !isHandsFreeMode;
    setHandsFreeMode(newMode);
    
    const language = preferences.language === "en" ? "en-NG" : preferences.language;
    
    if (newMode) {
      if (Platform.OS !== "web") {
        setVoiceError("Hands-free mode is only available on web browsers for MANU ASSIST");
        setHandsFreeMode(false);
        return;
      }
      
      if (preferences.voiceEnabled && voiceMode) {
        speakText("MANU ASSIST hands-free mode activated. I'm listening for your cooking commands.", language, 3);
      }
    } else {
      if (preferences.voiceEnabled && voiceMode) {
        speakText("MANU ASSIST hands-free mode deactivated", language, 3);
      }
    }
  };
  
  const toggleVoiceMode = () => {
    const newMode = !voiceMode;
    setVoiceMode(newMode);
    
    const language = preferences.language === "en" ? "en-NG" : preferences.language;
    
    if (newMode) {
      speakText("MANU ASSIST voice mode enabled. I'll speak my cooking responses.", language, 3);
    }
  };
  
  const removeImage = () => {
    setImage(null);
    setShowImagePreview(false);
  };
  
  return (
    <View style={styles.container}>
      {/* Voice Status Indicator */}
      {(isListening || isHandsFreeMode) && (
        <View style={styles.voiceStatusContainer}>
          <View style={styles.voiceIndicator}>
            <Animated.View 
              style={[
                styles.voiceLevelBar,
                {
                  height: voiceLevelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, 20],
                  }),
                }
              ]} 
            />
            <View style={styles.voiceStatusTextContainer}>
              <Text variant="caption" style={styles.voiceStatusText}>
                {isProcessingVoice ? "Processing..." : 
                 isHandsFreeMode ? "MANU ASSIST hands-free mode" : "Listening..."}
              </Text>
              {lastVoiceCommand && (
                <Text variant="caption" style={styles.lastCommandText}>
                  "{lastVoiceCommand}"
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
      
      {/* Voice Error Display */}
      {voiceError && (
        <View style={styles.voiceErrorContainer}>
          <Text variant="caption" style={styles.voiceErrorText}>
            {voiceError}
          </Text>
        </View>
      )}
      
      {/* Platform Warning */}
      {Platform.OS !== "web" && (isHandsFreeMode || isListening) && (
        <View style={styles.platformWarningContainer}>
          <Text variant="caption" style={styles.platformWarningText}>
            Voice features work best on web browsers. For full MANU ASSIST voice support, please use Chrome, Edge, or Safari.
          </Text>
        </View>
      )}
      
      {image && (
        <View style={styles.imagePreviewContainer}>
          <TouchableOpacity 
            style={styles.imagePreview} 
            onPress={() => setShowImagePreview(true)}
          >
            <Image source={{ uri: image }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <X size={14} color={colors.white} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputRow}>
        <View style={styles.mediaButtons}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleImagePick}
            disabled={disabled}
          >
            <ImageIcon size={18} color={colors.primary} />
          </TouchableOpacity>
          
          {Platform.OS !== "web" && (
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleCameraCapture}
              disabled={disabled}
            >
              <Camera size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        <Input
          placeholder={isHandsFreeMode ? "Speak to MANU ASSIST..." : placeholder}
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          disabled={disabled}
          containerStyle={styles.inputContainer}
          style={styles.input}
          rightIcon={
            showCancelButton ? (
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.cancelButton}
              >
                <StopCircle size={18} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSend}
                disabled={(!message.trim() && !image) || disabled}
                style={[
                  styles.sendButton,
                  (!message.trim() && !image || disabled) && styles.disabledButton,
                ]}
              >
                <Send size={18} color={colors.white} />
              </TouchableOpacity>
            )
          }
          onRightIconPress={showCancelButton ? handleCancel : handleSend}
          leftIcon={
            <View style={styles.voiceControls}>
              <Animated.View style={{ transform: [{ scale: micPulseAnim }] }}>
                <TouchableOpacity
                  onPress={toggleVoiceInput}
                  disabled={disabled}
                  style={[
                    styles.micButton,
                    (isListening && !isContinuousListening) && styles.micButtonActive,
                    isProcessingVoice && styles.micButtonProcessing,
                    Platform.OS !== "web" && styles.micButtonDisabled,
                  ]}
                >
                  <Mic size={16} color={
                    Platform.OS !== "web" ? colors.textSecondary :
                    isProcessingVoice ? colors.warning :
                    (isListening && !isContinuousListening) ? colors.white : colors.primary
                  } />
                </TouchableOpacity>
              </Animated.View>
              
              <TouchableOpacity
                onPress={toggleVoiceMode}
                style={[
                  styles.voiceModeButton,
                  voiceMode && styles.voiceModeButtonActive,
                ]}
              >
                {voiceMode ? (
                  <Volume2 size={14} color={colors.white} />
                ) : (
                  <VolumeX size={14} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={toggleHandsFreeMode}
                style={[
                  styles.handsFreeButton,
                  isHandsFreeMode && styles.handsFreeButtonActive,
                  Platform.OS !== "web" && styles.handsFreeButtonDisabled,
                ]}
              >
                {isHandsFreeMode ? (
                  <MicOff size={14} color={colors.white} />
                ) : (
                  <Mic size={14} color={Platform.OS !== "web" ? colors.textSecondary : colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          }
        />
      </View>
      
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image source={{ uri: image || "" }} style={styles.fullImage} />
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowImagePreview(false)}
            >
              <X size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colorPalette.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadows.sm,
  },
  voiceStatusContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  voiceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colorPalette.purple[600]}20`,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  voiceLevelBar: {
    width: 3,
    backgroundColor: colorPalette.purple[600],
    borderRadius: borderRadius.xs,
    marginRight: spacing.sm,
  },
  voiceStatusTextContainer: {
    flex: 1,
  },
  voiceStatusText: {
    color: colorPalette.purple[600],
    fontWeight: typography.weights.semibold,
    fontSize: typography.sm,
  },
  lastCommandText: {
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.xs,
    fontSize: typography.xs,
  },
  voiceErrorContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: `${colorPalette.red[500]}20`,
    borderRadius: borderRadius.sm,
  },
  voiceErrorText: {
    color: colorPalette.red[500],
    textAlign: "center",
    fontSize: typography.sm,
  },
  platformWarningContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: `${colorPalette.yellow[500]}20`,
    borderRadius: borderRadius.sm,
  },
  platformWarningText: {
    color: colorPalette.yellow[600],
    textAlign: "center",
    fontSize: typography.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  mediaButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  mediaButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.gray[100],
  },
  inputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  input: {
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    backgroundColor: colorPalette.purple[600],
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colorPalette.red[500],
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  voiceControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  micButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.gray[100],
  },
  micButtonActive: {
    backgroundColor: colorPalette.purple[600],
  },
  micButtonProcessing: {
    backgroundColor: colorPalette.yellow[500],
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  voiceModeButton: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.gray[100],
  },
  voiceModeButtonActive: {
    backgroundColor: colorPalette.purple[600],
  },
  handsFreeButton: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.gray[100],
  },
  handsFreeButtonActive: {
    backgroundColor: colorPalette.green[500],
  },
  handsFreeButtonDisabled: {
    opacity: 0.5,
  },
  imagePreviewContainer: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 18,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "70%",
    position: "relative",
  },
  fullImage: {
    width: "100%",
    height: "100%",
    borderRadius: borderRadius.sm,
  },
  closeButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});