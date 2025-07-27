import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Play,
  Pause,
  Volume2,
  Camera,
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useTheme } from '@/hooks/useTheme';

const { width: screenWidth } = Dimensions.get('window');
const maxBubbleWidth = screenWidth * 0.75;

interface Message {
  id: string;
  type: 'user' | 'ai';
  contentType: 'text' | 'voice' | 'image' | 'video';
  content: string;
  metadata?: {
    audioUrl?: string;
    duration?: number;
    transcript?: string;
    analysis?: any;
    confidence?: number;
  };
  timestamp: number;
  processing?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isProcessing?: boolean;
}

export function MessageBubble({ message, isProcessing }: MessageBubbleProps) {
  const { colors } = useTheme();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const isUser = message.type === 'user';
  const isAI = message.type === 'ai';

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = async () => {
    if (!message.metadata?.audioUrl) return;

    try {
      if (audioSound) {
        await audioSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: message.metadata.audioUrl },
        { shouldPlay: true }
      );

      setAudioSound(sound);
      setIsPlayingAudio(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const stopAudio = async () => {
    if (audioSound) {
      await audioSound.stopAsync();
      setIsPlayingAudio(false);
    }
  };

  const renderTextContent = () => (
    <View style={styles.textContainer}>
      <Text style={[
        styles.messageText,
        isUser ? styles.userMessageText : styles.aiMessageText
      ]}>
        {message.content}
      </Text>
      {isProcessing && (
        <View style={styles.processingIndicator}>
          <ActivityIndicator size="small" color={isUser ? '#FFFFFF' : '#3B82F6'} />
          <Text style={[
            styles.processingText,
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            Processing...
          </Text>
        </View>
      )}
    </View>
  );

  const renderVoiceContent = () => (
    <View style={styles.voiceContainer}>
      <TouchableOpacity
        style={[
          styles.voicePlayButton,
          isUser ? styles.userVoiceButton : styles.aiVoiceButton
        ]}
        onPress={isPlayingAudio ? stopAudio : playAudio}
      >
        {isPlayingAudio ? (
          <Pause size={20} color={isUser ? '#FFFFFF' : '#3B82F6'} />
        ) : (
          <Play size={20} color={isUser ? '#FFFFFF' : '#3B82F6'} />
        )}
      </TouchableOpacity>
      
      <View style={styles.voiceInfo}>
        <View style={styles.voiceWaveform}>
          {/* Simplified waveform visualization */}
          {Array.from({ length: 12 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.random() * 20 + 8,
                  backgroundColor: isUser ? '#FFFFFF' : '#3B82F6',
                  opacity: isPlayingAudio ? 0.8 : 0.4,
                }
              ]}
            />
          ))}
        </View>
        
        <Text style={[
          styles.voiceDuration,
          isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {message.metadata?.duration ? formatDuration(message.metadata.duration) : '0:00'}
        </Text>
      </View>
      
      <Volume2 
        size={16} 
        color={isUser ? '#FFFFFF' : '#3B82F6'} 
        style={styles.voiceIcon}
      />
      
      {/* Show transcript if available */}
      {message.metadata?.transcript && (
        <Text style={[
          styles.transcriptText,
          isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          "{message.metadata.transcript}"
        </Text>
      )}
    </View>
  );

  const renderImageContent = () => (
    <View style={styles.imageContainer}>
      <View style={styles.imageWrapper}>
        {imageLoading && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        )}
        
        {imageError ? (
          <View style={styles.imageErrorContainer}>
            <AlertCircle size={32} color="#EF4444" />
            <Text style={styles.imageErrorText}>Failed to load image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: message.content }}
            style={styles.messageImage}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.imageOverlay}>
          <Camera size={16} color="#FFFFFF" />
        </View>
      </View>
      
      {/* Show analysis results if available */}
      {message.metadata?.analysis && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>AI Analysis:</Text>
          <Text style={styles.analysisText}>
            {message.metadata.analysis.description || 'Image analyzed successfully'}
          </Text>
          {message.metadata.confidence && (
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(message.metadata.confidence * 100)}%
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderVideoContent = () => (
    <View style={styles.videoContainer}>
      <View style={styles.videoWrapper}>
        <View style={styles.videoPlaceholder}>
          <Video size={48} color="#FFFFFF" />
          <Text style={styles.videoText}>Video Message</Text>
        </View>
        
        <TouchableOpacity style={styles.videoPlayButton}>
          <Play size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {message.metadata?.duration && (
        <Text style={styles.videoDuration}>
          {formatDuration(message.metadata.duration)}
        </Text>
      )}
    </View>
  );

  const renderContent = () => {
    switch (message.contentType) {
      case 'text':
        return renderTextContent();
      case 'voice':
        return renderVoiceContent();
      case 'image':
        return renderImageContent();
      case 'video':
        return renderVideoContent();
      default:
        return renderTextContent();
    }
  };

  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      {/* AI Avatar */}
      {isAI && (
        <View style={styles.aiAvatar}>
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            style={styles.aiAvatarGradient}
          >
            <Text style={styles.aiAvatarText}>🤖</Text>
          </LinearGradient>
        </View>
      )}
      
      {/* Message Bubble */}
      <View style={[
        styles.messageBubble,
        isUser ? styles.userMessageBubble : styles.aiMessageBubble,
        isProcessing && styles.processingBubble
      ]}>
        {renderContent()}
        
        {/* Timestamp */}
        <View style={styles.timestampContainer}>
          <Text style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.aiTimestamp
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          
          {/* Delivery status for user messages */}
          {isUser && !isProcessing && (
            <CheckCircle size={12} color="rgba(255, 255, 255, 0.7)" style={styles.deliveryIcon} />
          )}
          
          {isProcessing && (
            <Clock size={12} color="rgba(255, 255, 255, 0.7)" style={styles.deliveryIcon} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    marginRight: 8,
    marginTop: 4,
  },
  aiAvatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: maxBubbleWidth,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: '#1F2937',
    borderBottomLeftRadius: 4,
  },
  processingBubble: {
    opacity: 0.8,
  },
  textContainer: {
    minWidth: 60,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#F3F4F6',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  processingText: {
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  voicePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userVoiceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  aiVoiceButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  voiceInfo: {
    flex: 1,
    marginRight: 8,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginBottom: 4,
  },
  waveformBar: {
    width: 2,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  voiceDuration: {
    fontSize: 12,
    opacity: 0.8,
  },
  voiceIcon: {
    opacity: 0.7,
  },
  transcriptText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.8,
  },
  imageContainer: {
    minWidth: 200,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  imageErrorContainer: {
    width: 200,
    height: 150,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
  analysisContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  analysisTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 12,
    color: '#F3F4F6',
    lineHeight: 16,
  },
  confidenceText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  videoContainer: {
    minWidth: 200,
  },
  videoWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#FFFFFF',
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  deliveryIcon: {
    marginLeft: 4,
  },
});