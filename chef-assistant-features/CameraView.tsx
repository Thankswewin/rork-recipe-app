import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Platform } from "react-native";
import { CameraView as ExpoCameraView, CameraType, useCameraPermissions } from "expo-camera";
import { colors } from "@/constants/colors";
import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { Camera, RefreshCw, Mic, MicOff } from "lucide-react-native";
import { simulateVisionAnalysis, simulateTextToSpeech } from "@/utils/ai";
import { useAppStore } from "@/store/appStore";

export function CameraView() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const cameraRef = useRef(null);
  
  const currentAgent = useAppStore((state) => state.currentAgent);
  const isRecording = useAppStore((state) => state.isRecording);
  const toggleRecording = useAppStore((state) => state.toggleRecording);
  
  // Simulate periodic analysis when recording is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && currentAgent) {
      interval = setInterval(async () => {
        setAnalyzing(true);
        try {
          const result = await simulateVisionAnalysis(currentAgent.id);
          setFeedback(result);
          simulateTextToSpeech(result);
        } catch (error) {
          console.error("Analysis error:", error);
        } finally {
          setAnalyzing(false);
        }
      }, 10000); // Analyze every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, currentAgent]);
  
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
          We need camera permission to provide real-time assistance
        </Text>
        <Button 
          title="Grant Permission" 
          onPress={requestPermission} 
          style={styles.permissionButton}
        />
      </View>
    );
  }
  
  const toggleCameraFacing = () => {
    setFacing(current => (current === "back" ? "front" : "back"));
  };
  
  const handleAnalyzePress = async () => {
    if (!currentAgent) return;
    
    setAnalyzing(true);
    try {
      const result = await simulateVisionAnalysis(currentAgent.id);
      setFeedback(result);
      simulateTextToSpeech(result);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.webCameraPlaceholder}>
          <Camera size={48} color={colors.textSecondary} />
          <Text style={styles.webCameraText}>
            Camera preview not available on web.
            {"\n"}
            Please use a mobile device for the full experience.
          </Text>
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
              </View>
            ) : null}
          </View>
        </ExpoCameraView>
      )}
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={toggleCameraFacing}
          disabled={Platform.OS === "web"}
        >
          <RefreshCw size={24} color={colors.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.recordButton, 
            isRecording && styles.recordingButton
          ]} 
          onPress={toggleRecording}
        >
          {isRecording ? (
            <View style={styles.recordingIndicator} />
          ) : (
            <View style={styles.recordButtonInner} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleAnalyzePress}
          disabled={analyzing || !currentAgent}
        >
          {isRecording ? (
            <MicOff size={24} color={colors.white} />
          ) : (
            <Mic size={24} color={colors.white} />
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
    borderRadius: 16,
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
    padding: 20,
  },
  webCameraText: {
    textAlign: "center",
    marginTop: 16,
    color: colors.textSecondary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 16,
  },
  feedbackContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 80,
  },
  feedbackText: {
    color: colors.white,
    fontSize: 16,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.error,
  },
  recordingButton: {
    backgroundColor: colors.error,
  },
  recordingIndicator: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    width: 200,
  },
});