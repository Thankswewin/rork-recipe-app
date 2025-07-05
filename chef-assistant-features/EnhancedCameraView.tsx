import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Platform, Text as RNText, ActivityIndicator } from "react-native";
import { CameraView as ExpoCameraView, CameraType, useCameraPermissions } from "expo-camera";
import { colors } from "@/constants/colors";
import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { Camera, RefreshCw, Mic, MicOff, Image as ImageIcon, Video, Zap, Volume2, VolumeX } from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { 
  analyzeImageWithGemma, 
  speakText, 
  startSpeechRecognition, 
  analyzeCameraFrame,
  RealTimeAnalyzer,
  simulateVisionAnalysis,
  speakUrgent,
  stopSpeaking
} from "@/utils/gemma";

export function EnhancedCameraView() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<{ stop: () => void } | null>(null);
  const [captureMode, setCaptureMode] = useState<"photo" | "video" | "realtime">("realtime");
  const [processingCount, setProcessingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [realTimeAnalyzer, setRealTimeAnalyzer] = useState<RealTimeAnalyzer | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  // Properly type the camera ref
  const cameraRef = useRef<ExpoCameraView>(null);
  
  const currentAgent = useAppStore((state) => state.currentAgent);
  const isRecording = useAppStore((state) => state.isRecording);
  const toggleRecording = useAppStore((state) => state.toggleRecording);
  const preferences = useAppStore((state) => state.preferences);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const receiveMessage = useAppStore((state) => state.receiveMessage);
  const voiceMode = useAppStore((state) => state.voiceMode);
  const isHandsFreeMode = useAppStore((state) => state.isHandsFreeMode);
  
  // Initialize real-time analyzer
  useEffect(() => {
    if (currentAgent) {
      const analyzer = new RealTimeAnalyzer(
        currentAgent.id,
        (result) => {
          setFeedback(result);
          
          // Speak the result if voice is enabled
          if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
            const language = preferences.language === "en" ? "en-NG" : preferences.language;
            speakText(result, language, 1);
          }
          
          // Add to chat occasionally (every 3rd analysis to avoid spam)
          if (processingCount % 3 === 0) {
            receiveMessage(`📹 Camera Analysis: ${result}`);
          }
          setProcessingCount(prev => prev + 1);
        }
      );
      
      setRealTimeAnalyzer(analyzer);
      
      return () => {
        analyzer.cleanup();
      };
    }
  }, [currentAgent, preferences.voiceEnabled, preferences.language, receiveMessage, voiceMode, isHandsFreeMode]);
  
  // Real-time frame capture and analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && currentAgent && captureMode === "realtime" && Platform.OS !== "web") {
      interval = setInterval(async () => {
        if (!analyzing && cameraRef.current) {
          try {
            setAnalyzing(true);
            
            // Capture frame from camera
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.3, // Lower quality for faster processing
              base64: true,
              skipProcessing: true,
            });
            
            if (photo.base64 && realTimeAnalyzer) {
              await realTimeAnalyzer.addFrame(photo.base64);
            }
          } catch (error) {
            console.error("Error capturing frame:", error);
            // Fallback to simulated analysis
            const result = simulateVisionAnalysis(currentAgent.id);
            setFeedback(result);
            
            // Speak fallback result if voice is enabled
            if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
              const language = preferences.language === "en" ? "en-NG" : preferences.language;
              speakText(result, language, 1);
            }
          } finally {
            setAnalyzing(false);
          }
        }
      }, 4000); // Capture frame every 4 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, currentAgent, captureMode, analyzing, realTimeAnalyzer, preferences.voiceEnabled, voiceMode, isHandsFreeMode, preferences.language]);
  
  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognition) {
        speechRecognition.stop();
      }
    };
  }, [speechRecognition]);
  
  const performAnalysis = async () => {
    if (!currentAgent || analyzing) return;
    
    setAnalyzing(true);
    setProcessingCount(prev => prev + 1);
    setError(null);
    
    try {
      let result = "";
      
      if (Platform.OS !== "web" && cameraRef.current && captureMode === "photo") {
        // For photo mode, capture and analyze a single frame
        result = await analyzeCameraFrame(cameraRef, currentAgent.id, "Single photo analysis");
      } else {
        // For other modes or fallback, use simulated responses
        result = simulateVisionAnalysis(currentAgent.id);
      }
      
      setFeedback(result);
      
      // Speak the result if voice is enabled
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        const language = preferences.language === "en" ? "en-NG" : preferences.language;
        speakText(result, language, 2);
      }
      
      // Add the analysis to the chat
      sendMessage("📸 Analyze what you see in the camera");
      receiveMessage(`📸 Camera Analysis: ${result}`);
    } catch (error) {
      console.error("Analysis error:", error);
      setError("Error analyzing image. Please try again.");
      setFeedback("I couldn't analyze the image. Let me try again in a moment.");
      
      // Speak error message if voice is enabled
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        const language = preferences.language === "en" ? "en-NG" : preferences.language;
        speakUrgent("I couldn't analyze the image. Let me try again in a moment.", language);
      }
    } finally {
      setAnalyzing(false);
    }
  };
  
  const toggleSpeechRecognition = () => {
    if (Platform.OS !== "web") {
      setVoiceError("Voice recognition is only available on web browsers");
      return;
    }
    
    setVoiceError(null);
    const language = preferences.language === "en" ? "en-NG" : preferences.language;
    
    if (isListening) {
      // Stop listening
      if (speechRecognition) {
        speechRecognition.stop();
      }
      setIsListening(false);
      setSpeechRecognition(null);
      setIsProcessingVoice(false);
      
      // Voice feedback
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        speakText("Voice input stopped", language, 1);
      }
    } else {
      // Start listening
      setIsProcessingVoice(true);
      
      const recognition = startSpeechRecognition(
        language,
        (text) => {
          // Handle speech recognition result
          sendMessage(`🎤 Voice: ${text}`);
          setIsProcessingVoice(false);
          setVoiceError(null);
          
          // Process the command
          handleVoiceCommand(text);
        },
        (error) => {
          console.error("Speech recognition error:", error);
          setVoiceError(error);
          setFeedback("Error with speech recognition. Please try again.");
          setIsProcessingVoice(false);
          
          // Speak error message
          if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
            speakUrgent("Error with speech recognition. Please try again.", language);
          }
        },
        true // Continuous listening
      );
      
      setSpeechRecognition(recognition);
      setIsListening(true);
      setFeedback("🎤 Listening... Speak your command.");
      
      // Voice feedback
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        speakText("Voice input activated. I'm listening.", language, 2);
      }
    }
  };
  
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    const language = preferences.language === "en" ? "en-NG" : preferences.language;
    
    // Handle basic camera commands
    if (lowerCommand.includes("flip camera") || lowerCommand.includes("switch camera")) {
      toggleCameraFacing();
      receiveMessage("📹 Switched camera view");
      
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        speakText("Camera flipped", language, 1);
      }
      return;
    }
    
    if (lowerCommand.includes("take photo") || lowerCommand.includes("capture image") || lowerCommand.includes("analyze this")) {
      setCaptureMode("photo");
      performAnalysis();
      
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        speakText("Taking photo for analysis", language, 1);
      }
      return;
    }
    
    if (lowerCommand.includes("start recording") || lowerCommand.includes("begin recording") || lowerCommand.includes("start analysis")) {
      if (!isRecording) {
        toggleRecording();
        receiveMessage("📹 Started real-time analysis");
        
        if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
          speakText("Started real-time analysis", language, 1);
        }
      }
      return;
    }
    
    if (lowerCommand.includes("stop recording") || lowerCommand.includes("end recording") || lowerCommand.includes("stop analysis")) {
      if (isRecording) {
        toggleRecording();
        receiveMessage("📹 Stopped real-time analysis");
        
        if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
          speakText("Stopped real-time analysis", language, 1);
        }
      }
      return;
    }
    
    // Voice control commands
    if (lowerCommand.includes("stop talking") || lowerCommand.includes("be quiet") || lowerCommand.includes("silence")) {
      stopSpeaking();
      return;
    }
    
    if (lowerCommand.includes("louder") || lowerCommand.includes("speak up")) {
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        speakText("I'll speak louder now", language, 2);
      }
      return;
    }
    
    // Cooking-specific voice commands
    if (lowerCommand.includes("what do you see") || lowerCommand.includes("describe this")) {
      performAnalysis();
      return;
    }
    
    if (lowerCommand.includes("is this ready") || lowerCommand.includes("is it done")) {
      const response = "Let me analyze the cooking progress for you.";
      receiveMessage(`🎤 ${response}`);
      performAnalysis();
      
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        speakText(response, language, 1);
      }
      return;
    }
    
    if (lowerCommand.includes("how does it look") || lowerCommand.includes("check my food")) {
      const response = "I'll check how your food is looking right now.";
      receiveMessage(`🎤 ${response}`);
      performAnalysis();
      
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        speakText(response, language, 1);
      }
      return;
    }
    
    // If no specific command is recognized, treat it as a question for the agent
    receiveMessage(`🎤 Processing voice command: "${command}"`);
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const response = simulateVisionAnalysis(currentAgent?.id || "cooking");
      receiveMessage(`🤖 ${response}`);
      
      // Speak the response if voice is enabled
      if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
        speakText(response, language, 1);
      }
    }, 1000);
  };
  
  const toggleCameraFacing = () => {
    setFacing(current => (current === "back" ? "front" : "back"));
  };
  
  const handleCaptureModeChange = (mode: "photo" | "video" | "realtime") => {
    setCaptureMode(mode);
    
    if (mode === "realtime" && !isRecording) {
      toggleRecording();
    } else if (mode !== "realtime" && isRecording) {
      toggleRecording();
    }
    
    if (mode === "photo") {
      performAnalysis();
    }
    
    // Update real-time analyzer settings
    if (realTimeAnalyzer) {
      if (mode === "realtime") {
        realTimeAnalyzer.setAnalysisInterval(3000); // 3 seconds for real-time
      } else {
        realTimeAnalyzer.setAnalysisInterval(10000); // 10 seconds for other modes
      }
    }
    
    // Send feedback to chat
    receiveMessage(`📹 Switched to ${mode} mode`);
    
    // Voice feedback
    if (preferences.voiceEnabled && (voiceMode || isHandsFreeMode)) {
      const language = preferences.language === "en" ? "en-NG" : preferences.language;
      speakText(`Switched to ${mode} mode`, language, 1);
    }
  };
  
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission needed for real-time assistance
        </Text>
        <Button 
          title="Grant Permission" 
          onPress={requestPermission} 
          style={styles.permissionButton}
        />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.webCameraPlaceholder}>
          <Camera size={32} color={colors.textSecondary} />
          <Text style={styles.webCameraText}>
            Camera preview not available on web
          </Text>
          <Text style={styles.webCameraSubtext}>
            Use mobile device for real-time analysis
          </Text>
          {voiceError && (
            <Text style={styles.webVoiceInfo}>
              Voice features available on web browsers
            </Text>
          )}
        </View>
      ) : (
        <ExpoCameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
        >
          <View style={styles.overlay}>
            {feedback ? (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackText}>{feedback}</Text>
                {captureMode === "realtime" && isRecording && (
                  <View style={styles.realTimeIndicator}>
                    <View style={styles.pulsingDot} />
                    <Text style={styles.realTimeText}>Live Analysis</Text>
                  </View>
                )}
              </View>
            ) : null}
            
            {analyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.analyzingText}>
                  {captureMode === "realtime" ? "Analyzing..." : "Processing..."}
                </Text>
              </View>
            )}
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {voiceError && (
              <View style={styles.voiceErrorContainer}>
                <Text style={styles.voiceErrorText}>{voiceError}</Text>
              </View>
            )}
            
            {isListening && (
              <View style={styles.listeningContainer}>
                <RNText style={styles.listeningWave}>
                  {isProcessingVoice ? "🎤 Processing..." : "🎤 ▁ ▂ ▃ ▄ ▅ ▆ ▇"}
                </RNText>
              </View>
            )}
            
            {/* Voice Mode Indicator */}
            {(voiceMode || isHandsFreeMode) && (
              <View style={styles.voiceModeIndicator}>
                {voiceMode && (
                  <View style={styles.voiceModeItem}>
                    <Volume2 size={12} color={colors.primary} />
                    <Text style={styles.voiceModeText}>Voice</Text>
                  </View>
                )}
                {isHandsFreeMode && (
                  <View style={styles.voiceModeItem}>
                    <Mic size={12} color={colors.success} />
                    <Text style={styles.voiceModeText}>Hands-free</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ExpoCameraView>
      )}
      
      <View style={styles.captureModeContainer}>
        <TouchableOpacity 
          style={[styles.captureModeButton, captureMode === "photo" && styles.activeCaptureModeButton]} 
          onPress={() => handleCaptureModeChange("photo")}
        >
          <ImageIcon size={16} color={captureMode === "photo" ? colors.white : colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.captureModeButton, captureMode === "realtime" && styles.activeCaptureModeButton]} 
          onPress={() => handleCaptureModeChange("realtime")}
        >
          <Zap size={16} color={captureMode === "realtime" ? colors.white : colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={toggleCameraFacing}
          disabled={Platform.OS === "web"}
        >
          <RefreshCw size={18} color={colors.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.recordButton, 
            isRecording && styles.recordingButton,
            captureMode === "photo" && styles.photoButton
          ]} 
          onPress={captureMode === "photo" ? performAnalysis : toggleRecording}
        >
          {captureMode === "photo" ? (
            <View style={styles.photoButtonInner} />
          ) : isRecording ? (
            <View style={styles.recordingIndicator} />
          ) : (
            <View style={styles.recordButtonInner} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.controlButton, 
            isListening && styles.listeningButton,
            isProcessingVoice && styles.processingButton,
            Platform.OS !== "web" && styles.controlButtonDisabled
          ]}
          onPress={toggleSpeechRecognition}
          disabled={Platform.OS !== "web"}
        >
          {isListening ? (
            <MicOff size={18} color={colors.white} />
          ) : (
            <Mic size={18} color={Platform.OS !== "web" ? colors.textSecondary : colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  webCameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
  },
  webCameraText: {
    textAlign: "center",
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 12,
  },
  webCameraSubtext: {
    textAlign: "center",
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 10,
    opacity: 0.7,
  },
  webVoiceInfo: {
    textAlign: "center",
    marginTop: 8,
    color: colors.primary,
    fontSize: 10,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 8,
  },
  feedbackContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 6,
    padding: 8,
    marginBottom: 60,
  },
  feedbackText: {
    color: colors.white,
    fontSize: 12,
  },
  realTimeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  realTimeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "bold",
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.7)",
    borderRadius: 6,
    padding: 8,
    marginBottom: 60,
  },
  errorText: {
    color: colors.white,
    fontSize: 12,
  },
  voiceErrorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.7)",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  voiceErrorText: {
    color: colors.white,
    fontSize: 11,
    textAlign: "center",
  },
  analyzingContainer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 4,
  },
  analyzingText: {
    color: colors.white,
    marginLeft: 6,
    fontSize: 11,
  },
  listeningContainer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 4,
  },
  listeningWave: {
    color: colors.primary,
    fontSize: 12,
  },
  voiceModeIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "column",
    gap: 4,
  },
  voiceModeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  voiceModeText: {
    color: colors.white,
    fontSize: 8,
    marginLeft: 2,
  },
  captureModeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 4,
  },
  captureModeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeCaptureModeButton: {
    backgroundColor: colors.primary,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  listeningButton: {
    backgroundColor: colors.primary,
  },
  processingButton: {
    backgroundColor: colors.warning,
  },
  recordButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  photoButton: {
    backgroundColor: colors.primary,
  },
  recordButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error,
  },
  photoButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  recordingButton: {
    backgroundColor: colors.error,
  },
  recordingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 12,
  },
  permissionButton: {
    width: 150,
  },
});