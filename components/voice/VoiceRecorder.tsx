import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader,
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUri: string, duration: number) => void;
  onTranscriptionComplete?: (text: string) => void;
  disabled?: boolean;
  maxDuration?: number; // in seconds
  showWaveform?: boolean;
  enableTranscription?: boolean;
  unmuteEndpoint?: string; // unmute.sh service endpoint
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUri?: string;
  isProcessing: boolean;
  isTranscribing: boolean;
}

interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  sound?: Audio.Sound;
}

export function VoiceRecorder({
  onRecordingComplete,
  onTranscriptionComplete,
  disabled = false,
  maxDuration = 300, // 5 minutes default
  showWaveform = true,
  enableTranscription = true,
  unmuteEndpoint = 'http://localhost:8080', // Default unmute.sh endpoint
}: VoiceRecorderProps) {
  const { colors } = useTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    isProcessing: false,
    isTranscribing: false,
  });
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
  });
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveformAnim = useRef(new Animated.Value(0)).current;
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
      if (playbackState.sound) {
        playbackState.sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      startPulseAnimation();
      startWaveformAnimation();
    } else {
      stopAnimations();
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveformAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveformAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveformAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioUri: undefined,
      }));

      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          return { ...prev, duration: newDuration };
        });
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;

    try {
      await recording.pauseAsync();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    } catch (err) {
      console.error('Failed to pause recording', err);
    }
  };

  const resumeRecording = async () => {
    if (!recording) return;

    try {
      await recording.startAsync();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
      
      // Resume timer
      recordingTimer.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          return { ...prev, duration: newDuration };
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to resume recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setRecordingState(prev => ({ ...prev, isProcessing: true }));
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      if (uri) {
        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioUri: uri,
          isProcessing: false,
        }));

        onRecordingComplete(uri, recordingState.duration);

        // Start transcription if enabled
        if (enableTranscription && onTranscriptionComplete) {
          await transcribeAudio(uri);
        }
      }

      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecordingState(prev => ({ ...prev, isProcessing: false }));
      Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    if (!onTranscriptionComplete) return;

    try {
      setRecordingState(prev => ({ ...prev, isTranscribing: true }));

      // Read audio file
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to unmute.sh service for transcription
      const response = await fetch(`${unmuteEndpoint}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: audioData,
          format: 'wav',
          language: 'auto', // Auto-detect language
        }),
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.text) {
        onTranscriptionComplete(result.text);
      }
    } catch (err) {
      console.error('Transcription failed:', err);
      Alert.alert('Transcription Error', 'Failed to transcribe audio. The recording was saved successfully.');
    } finally {
      setRecordingState(prev => ({ ...prev, isTranscribing: false }));
    }
  };

  const playRecording = async () => {
    if (!recordingState.audioUri) return;

    try {
      if (playbackState.sound) {
        await playbackState.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingState.audioUri },
        { shouldPlay: true }
      );

      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setPlaybackState({
          isPlaying: true,
          position: 0,
          duration: status.durationMillis || 0,
          sound,
        });

        // Start playback timer
        playbackTimer.current = setInterval(async () => {
          const currentStatus = await sound.getStatusAsync();
          if (currentStatus.isLoaded) {
            setPlaybackState(prev => ({
              ...prev,
              position: currentStatus.positionMillis || 0,
              isPlaying: currentStatus.isPlaying,
            }));

            if (!currentStatus.isPlaying && currentStatus.didJustFinish) {
              setPlaybackState(prev => ({ ...prev, isPlaying: false, position: 0 }));
              if (playbackTimer.current) {
                clearInterval(playbackTimer.current);
              }
            }
          }
        }, 100);
      }
    } catch (err) {
      console.error('Failed to play recording', err);
      Alert.alert('Playback Error', 'Failed to play recording.');
    }
  };

  const pausePlayback = async () => {
    if (playbackState.sound) {
      await playbackState.sound.pauseAsync();
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMilliseconds = (ms: number) => {
    return formatDuration(Math.floor(ms / 1000));
  };

  const renderWaveform = () => {
    if (!showWaveform) return null;

    const bars = Array.from({ length: 20 }, (_, i) => {
      const height = Animated.multiply(
        waveformAnim,
        new Animated.Value(Math.random() * 20 + 5)
      );

      return (
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              height,
              backgroundColor: recordingState.isRecording && !recordingState.isPaused 
                ? '#EF4444' 
                : '#6B7280',
            },
          ]}
        />
      );
    });

    return <View style={styles.waveformContainer}>{bars}</View>;
  };

  const getRecordButtonContent = () => {
    if (recordingState.isProcessing) {
      return <Loader size={24} color="#FFFFFF" />;
    }
    
    if (recordingState.isRecording) {
      return recordingState.isPaused ? (
        <Mic size={24} color="#FFFFFF" />
      ) : (
        <Square size={16} color="#FFFFFF" />
      );
    }
    
    return <Mic size={24} color="#FFFFFF" />;
  };

  const handleRecordPress = () => {
    if (disabled) return;

    if (!recordingState.isRecording) {
      startRecording();
    } else if (recordingState.isPaused) {
      resumeRecording();
    } else {
      stopRecording();
    }
  };

  const handlePausePress = () => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      pauseRecording();
    }
  };

  return (
    <View style={styles.container}>
      {/* Recording Controls */}
      <View style={styles.controlsContainer}>
        <Animated.View style={[styles.recordButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              recordingState.isRecording && styles.recordingButton,
              disabled && styles.disabledButton,
            ]}
            onPress={handleRecordPress}
            disabled={disabled || recordingState.isProcessing}
          >
            <LinearGradient
              colors={
                recordingState.isRecording
                  ? ['#EF4444', '#DC2626']
                  : ['#3B82F6', '#1D4ED8']
              }
              style={styles.recordButtonGradient}
            >
              {getRecordButtonContent()}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {recordingState.isRecording && (
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={handlePausePress}
          >
            <Pause size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Recording Status */}
      {recordingState.isRecording && (
        <View style={styles.statusContainer}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              {recordingState.isPaused ? 'Paused' : 'Recording'}
            </Text>
          </View>
          <Text style={styles.durationText}>
            {formatDuration(recordingState.duration)} / {formatDuration(maxDuration)}
          </Text>
        </View>
      )}

      {/* Waveform */}
      {recordingState.isRecording && renderWaveform()}

      {/* Transcription Status */}
      {recordingState.isTranscribing && (
        <View style={styles.transcriptionContainer}>
          <Loader size={16} color="#3B82F6" />
          <Text style={styles.transcriptionText}>Transcribing audio...</Text>
        </View>
      )}

      {/* Playback Controls */}
      {recordingState.audioUri && !recordingState.isRecording && (
        <View style={styles.playbackContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={playbackState.isPlaying ? pausePlayback : playRecording}
          >
            {playbackState.isPlaying ? (
              <Pause size={20} color="#3B82F6" />
            ) : (
              <Play size={20} color="#3B82F6" />
            )}
          </TouchableOpacity>
          
          <View style={styles.playbackInfo}>
            <Text style={styles.playbackTime}>
              {formatMilliseconds(playbackState.position)} / {formatMilliseconds(playbackState.duration)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(playbackState.position / playbackState.duration) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButtonContainer: {
    marginRight: 16,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  recordingButton: {
    // Additional styles for recording state
  },
  disabledButton: {
    opacity: 0.5,
  },
  recordButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginBottom: 16,
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  transcriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 8,
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playbackInfo: {
    flex: 1,
  },
  playbackTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
});