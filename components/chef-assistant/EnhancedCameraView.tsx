import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, Zap, ZapOff, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useChefAssistantStore } from '@/stores/chefAssistantStore';

interface EnhancedCameraViewProps {
  onClose: () => void;
  onCapture: (imageUri: string) => void;
}

export default function EnhancedCameraView({ onClose, onCapture }: EnhancedCameraViewProps) {
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { isAnalyzing, analyzeImage } = useChefAssistantStore();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Camera permission is required to analyze your cooking
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <LinearGradient
            colors={["#EF4444", "#DC2626"]}
            style={styles.permissionButtonGradient}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => !current);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        onCapture(photo.uri);
        
        // Auto-analyze the image
        if (Platform.OS !== 'web') {
          analyzeImage(photo.uri);
        }
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash ? 'on' : 'off'}
      >
        {/* Header Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={onClose}>
            <View style={[styles.controlIcon, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <X size={20} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <View style={[styles.controlIcon, { backgroundColor: flash ? '#FACC15' : 'rgba(0,0,0,0.6)' }]}>
              {flash ? (
                <Zap size={20} color="black" />
              ) : (
                <ZapOff size={20} color="white" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Analysis Overlay */}
        {isAnalyzing && (
          <View style={styles.analysisOverlay}>
            <LinearGradient
              colors={["rgba(16, 185, 129, 0.9)", "rgba(5, 150, 105, 0.9)"]}
              style={styles.analysisContainer}
            >
              <Text style={styles.analysisText}>🧠 Analyzing your cooking...</Text>
            </LinearGradient>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <View style={[styles.controlIcon, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <RotateCcw size={20} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.captureButtonContainer} 
            onPress={takePicture}
            disabled={isAnalyzing}
          >
            <LinearGradient
              colors={isAnalyzing ? ["#9CA3AF", "#6B7280"] : ["#EF4444", "#DC2626"]}
              style={styles.captureButton}
            >
              <Camera size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.controlButton}>
            {/* Placeholder for symmetry */}
          </View>
        </View>

        {/* Cooking Tips Overlay */}
        <View style={styles.tipsOverlay}>
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.5)"]}
            style={styles.tipsContainer}
          >
            <Text style={styles.tipsTitle}>💡 Camera Tips</Text>
            <Text style={styles.tipsText}>
              • Show ingredients clearly{'\n'}
              • Good lighting helps analysis{'\n'}
              • Capture cooking progress{'\n'}
              • Ask questions while cooking
            </Text>
          </LinearGradient>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    borderRadius: 16,
  },
  permissionButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisOverlay: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  analysisContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  analysisText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  captureButtonContainer: {
    borderRadius: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsOverlay: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 16,
  },
  tipsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipsText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
});