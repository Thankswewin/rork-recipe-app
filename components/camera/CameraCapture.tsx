import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

// String literal types for expo-camera v16
type CameraType = 'front' | 'back';
type FlashMode = 'off' | 'on' | 'auto';
import {
  X,
  Camera as CameraIcon,
  RotateCcw,
  Zap,
  ZapOff,
  Circle,
  Square,
  Eye,
  EyeOff,
  Scan,
  Image as ImageIcon,
} from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraCaptureProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (imageUri: string, analysis?: string) => void;
  enableRealTimeAnalysis?: boolean;
  analysisEndpoint?: string;
  mode?: 'photo' | 'video' | 'scan';
  maxVideoDuration?: number;
}

interface AnalysisResult {
  description: string;
  ingredients?: string[];
  cookingSteps?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  suggestions?: string[];
  confidence: number;
}

interface CameraState {
  type: CameraType;
  flash: FlashMode;
  isRecording: boolean;
  recordingDuration: number;
  isAnalyzing: boolean;
  lastAnalysis?: AnalysisResult;
  analysisHistory: AnalysisResult[];
}

export function CameraCapture({
  visible,
  onClose,
  onCapture,
  enableRealTimeAnalysis = true,
  analysisEndpoint = 'http://localhost:8080/analyze',
  mode = 'photo',
  maxVideoDuration = 60,
}: CameraCaptureProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);
  const analysisTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [cameraState, setCameraState] = useState<CameraState>({
    type: 'back',
    flash: 'off',
    isRecording: false,
    recordingDuration: 0,
    isAnalyzing: false,
    analysisHistory: [],
  });

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);

  useEffect(() => {
    if (visible && enableRealTimeAnalysis && permission?.granted) {
      startRealTimeAnalysis();
    } else {
      stopRealTimeAnalysis();
    }

    return () => {
      stopRealTimeAnalysis();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [visible, enableRealTimeAnalysis, permission?.granted]);

  const startRealTimeAnalysis = () => {
    if (analysisTimer.current) return;

    analysisTimer.current = setInterval(async () => {
      if (cameraRef.current && !cameraState.isAnalyzing && !cameraState.isRecording) {
        await captureAndAnalyze(false); // Don't save, just analyze
      }
    }, 3000); // Analyze every 3 seconds
  };

  const stopRealTimeAnalysis = () => {
    if (analysisTimer.current) {
      clearInterval(analysisTimer.current);
      analysisTimer.current = null;
    }
  };

  const requestPermissions = async () => {
    if (!permission?.granted) {
      const cameraPermission = await requestPermission();
      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to use this feature.');
        return false;
      }
    }

    if (!mediaPermission?.granted) {
      const mediaPermissionResult = await requestMediaPermission();
      if (!mediaPermissionResult.granted) {
        Alert.alert('Permission Required', 'Media library permission is required to save photos.');
        return false;
      }
    }

    return true;
  };

  const analyzeImage = async (imageUri: string): Promise<AnalysisResult | null> => {
    try {
      setCameraState(prev => ({ ...prev, isAnalyzing: true }));

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // Send to analysis endpoint
      const analysisResponse = await fetch(analysisEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          mode: 'cooking_analysis',
          include_ingredients: true,
          include_nutrition: true,
          include_suggestions: true,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed: ${analysisResponse.statusText}`);
      }

      const result = await analysisResponse.json();
      
      const analysis: AnalysisResult = {
        description: result.description || 'No description available',
        ingredients: result.ingredients || [],
        cookingSteps: result.cooking_steps || [],
        nutritionalInfo: result.nutrition || {},
        suggestions: result.suggestions || [],
        confidence: result.confidence || 0,
      };

      setCameraState(prev => ({
        ...prev,
        lastAnalysis: analysis,
        analysisHistory: [analysis, ...prev.analysisHistory.slice(0, 9)], // Keep last 10
      }));

      return analysis;
    } catch (error) {
      console.error('Image analysis failed:', error);
      return null;
    } finally {
      setCameraState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const captureAndAnalyze = async (saveToLibrary: boolean = true) => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (!photo?.uri) return;

      setCapturedMedia(photo.uri);

      // Analyze the image
      const analysis = await analyzeImage(photo.uri);

      if (saveToLibrary) {
        // Save to media library
        if (mediaPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        }

        // Call the onCapture callback
        onCapture(photo.uri, analysis?.description);
      }

      return { uri: photo.uri, analysis };
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Alert.alert('Capture Error', 'Failed to capture photo. Please try again.');
    }
  };

  const startVideoRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setCameraState(prev => ({ ...prev, isRecording: true, recordingDuration: 0 }));
      stopRealTimeAnalysis(); // Stop real-time analysis during recording

      const video = await cameraRef.current.recordAsync({
        maxDuration: maxVideoDuration,
      });

      if (video?.uri) {
        setCapturedMedia(video.uri);
        if (mediaPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(video.uri);
        }
        onCapture(video.uri);
      }
    } catch (error) {
      console.error('Failed to record video:', error);
      Alert.alert('Recording Error', 'Failed to record video. Please try again.');
    } finally {
      setCameraState(prev => ({ ...prev, isRecording: false, recordingDuration: 0 }));
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  };

  const stopVideoRecording = async () => {
    if (!cameraRef.current) return;

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const toggleCameraType = () => {
    setCameraState(prev => ({
      ...prev,
      type: prev.type === 'back' ? 'front' : 'back',
    }));
  };

  const toggleFlash = () => {
    setCameraState(prev => ({
      ...prev,
      flash: prev.flash === 'off' ? 'on' : 'off',
    }));
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setCapturedMedia(imageUri);
        
        // Analyze the selected image
        const analysis = await analyzeImage(imageUri);
        onCapture(imageUri, analysis?.description);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Gallery Error', 'Failed to select image from gallery.');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAnalysisOverlay = () => {
    if (!cameraState.lastAnalysis || !showAnalysis) return null;

    const { lastAnalysis } = cameraState;

    return (
      <View style={styles.analysisOverlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={styles.analysisContent}
        >
          <View style={styles.analysisHeader}>
            <Scan size={16} color="#3B82F6" />
            <Text style={styles.analysisTitle}>AI Analysis</Text>
            <Text style={styles.confidenceText}>
              {Math.round(lastAnalysis.confidence * 100)}% confident
            </Text>
          </View>
          
          <Text style={styles.analysisDescription}>
            {lastAnalysis.description}
          </Text>
          
          {lastAnalysis.ingredients && lastAnalysis.ingredients.length > 0 && (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Detected Ingredients:</Text>
              <Text style={styles.analysisSectionContent}>
                {lastAnalysis.ingredients.slice(0, 3).join(', ')}
                {lastAnalysis.ingredients.length > 3 && ` +${lastAnalysis.ingredients.length - 3} more`}
              </Text>
            </View>
          )}
          
          {lastAnalysis.suggestions && lastAnalysis.suggestions.length > 0 && (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Suggestions:</Text>
              <Text style={styles.analysisSectionContent}>
                {lastAnalysis.suggestions[0]}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.topRightControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            {cameraState.flash === 'on' ? (
              <Zap size={24} color="#F59E0B" />
            ) : (
              <ZapOff size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          {enableRealTimeAnalysis && (
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => setShowAnalysis(!showAnalysis)}
            >
              {showAnalysis ? (
                <EyeOff size={24} color="#FFFFFF" />
              ) : (
                <Eye size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Recording Duration */}
      {cameraState.isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>
            REC {formatDuration(cameraState.recordingDuration)}
          </Text>
        </View>
      )}
      
      {/* Analysis Indicator */}
      {cameraState.isAnalyzing && (
        <View style={styles.analysisIndicator}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.analysisIndicatorText}>Analyzing...</Text>
        </View>
      )}
      
      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <ImageIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.captureButton,
            cameraState.isRecording && styles.recordingCaptureButton,
          ]}
          onPress={
            mode === 'video'
              ? cameraState.isRecording
                ? stopVideoRecording
                : startVideoRecording
              : () => captureAndAnalyze(true)
          }
        >
          <LinearGradient
            colors={
              cameraState.isRecording
                ? ['#EF4444', '#DC2626']
                : ['#FFFFFF', '#F3F4F6']
            }
            style={styles.captureButtonGradient}
          >
            {mode === 'video' ? (
              cameraState.isRecording ? (
                <Square size={24} color="#FFFFFF" />
              ) : (
                <Circle size={24} color="#1F2937" />
              )
            ) : (
              <CameraIcon size={24} color="#1F2937" />
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
          <RotateCcw size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <CameraIcon size={64} color="#6B7280" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            This app needs access to your camera to capture photos and videos for AI analysis.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraState.type}
          flash={cameraState.flash}
          mode={mode === 'video' ? 'video' : 'picture'}
        >
          {renderAnalysisOverlay()}
          {renderControls()}
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  topRightControls: {
    flexDirection: 'row',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  analysisIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(59,130,246,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  analysisIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  recordingCaptureButton: {
    // Additional styles for recording state
  },
  captureButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  analysisContent: {
    padding: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  confidenceText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  analysisDescription: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    marginBottom: 12,
  },
  analysisSection: {
    marginBottom: 8,
  },
  analysisSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  analysisSectionContent: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 18,
  },
});