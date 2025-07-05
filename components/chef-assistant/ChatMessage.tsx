import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Mic, Brain } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { ChatMessage as ChatMessageType } from '@/stores/chefAssistantStore';

interface ChatMessageProps {
  message: ChatMessageType;
  onImagePress?: (imageUri: string) => void;
}

export default function ChatMessage({ message, onImagePress }: ChatMessageProps) {
  const { colors } = useTheme();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container,
      message.type === 'user' ? styles.userContainer : styles.assistantContainer
    ]}>
      {message.type === 'assistant' && (
        <View style={[styles.avatarContainer, { backgroundColor: '#10B981', borderColor: colors.iconBorder }]}>
          <Brain size={16} color="black" />
        </View>
      )}
      
      <View style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.assistantMessage
      ]}>
        {message.type === 'user' ? (
          <LinearGradient
            colors={["#EF4444", "#DC2626"]}
            style={styles.messageContent}
          >
            <Text style={[styles.messageText, { color: 'white' }]}>
              {message.content}
            </Text>
            {message.imageUri && (
              <TouchableOpacity 
                style={styles.imageContainer}
                onPress={() => onImagePress?.(message.imageUri!)}
              >
                <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
                <View style={[styles.imageOverlay, { backgroundColor: colors.iconBorder }]}>
                  <Camera size={12} color="white" />
                </View>
              </TouchableOpacity>
            )}
            {message.audioUri && (
              <View style={[styles.audioIndicator, { backgroundColor: colors.iconBorder }]}>
                <Mic size={12} color="white" />
                <Text style={styles.audioText}>Voice message</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={[styles.messageContent, { 
            backgroundColor: 'transparent',
            borderColor: colors.iconBorder,
            borderWidth: 2,
          }]}>
            <Text style={[styles.messageText, { color: colors.text }]}>
              {message.content}
            </Text>
            {message.metadata?.detectedIngredients && message.metadata.detectedIngredients.length > 0 && (
              <View style={styles.metadataContainer}>
                <Text style={[styles.metadataTitle, { color: colors.muted }]}>Detected ingredients:</Text>
                <Text style={[styles.metadataText, { color: colors.text }]}>
                  {message.metadata.detectedIngredients.join(', ')}
                </Text>
              </View>
            )}
            {message.metadata?.confidence && (
              <View style={styles.confidenceContainer}>
                <Text style={[styles.confidenceText, { color: colors.muted }]}>
                  Confidence: {Math.round(message.metadata.confidence * 100)}%
                </Text>
              </View>
            )}
          </View>
        )}
        
        <Text style={[styles.timestamp, { color: colors.muted }]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {message.type === 'user' && (
        <View style={[styles.avatarContainer, { backgroundColor: '#3B82F6', borderColor: colors.iconBorder }]}>
          <Text style={styles.userAvatar}>👤</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 8,
  },
  userAvatar: {
    fontSize: 14,
  },
  messageContainer: {
    flex: 1,
    maxWidth: '80%',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  audioText: {
    color: 'white',
    fontSize: 12,
  },
  metadataContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  metadataTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  metadataText: {
    fontSize: 12,
  },
  confidenceContainer: {
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2,
  },
});