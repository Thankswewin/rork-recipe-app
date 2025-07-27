import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Keyboard,
} from 'react-native';
import {
  Camera,
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/hooks/useTheme';

interface MultimodalInputProps {
  onSendMessage: (content: string, type?: 'text' | 'voice' | 'image' | 'video', metadata?: any) => void;
  onCameraPress: () => void;
  onVoicePress?: () => void;
  disabled?: boolean;
}

export function MultimodalInput({ onSendMessage, onCameraPress, onVoicePress, disabled = false }: MultimodalInputProps) {
  const { colors } = useTheme();
  const [inputText, setInputText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [isTyping, setIsTyping] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const attachmentAnim = useRef(new Animated.Value(0)).current;
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showAttachments) {
      Animated.spring(attachmentAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(attachmentAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [showAttachments]);

  const handleSendText = () => {
    if (!inputText.trim() || disabled) return;
    
    onSendMessage(inputText.trim(), 'text');
    setInputText('');
    setInputHeight(40);
    setIsTyping(false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    
    // Handle typing indicator
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
    }
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(Math.max(40, event.nativeEvent.contentSize.height), 120);
    setInputHeight(newHeight);
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onSendMessage(result.assets[0].uri, 'image');
        setShowAttachments(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleCameraPicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera access.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onSendMessage(result.assets[0].uri, 'image');
        setShowAttachments(false);
      }
    } catch (error) {
      console.error('Camera picker error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        onSendMessage(file.uri, 'text', { fileName: file.name });
        setShowAttachments(false);
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const toggleAttachments = () => {
    setShowAttachments(!showAttachments);
    if (showAttachments) {
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      {/* Attachment Options */}
      {showAttachments && (
        <Animated.View 
          style={[
            styles.attachmentContainer,
            {
              transform: [{
                translateY: attachmentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
              opacity: attachmentAnim,
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.attachmentOption}
            onPress={handleCameraPicker}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.attachmentOptionGradient}
            >
              <Camera size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.attachmentOptionText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.attachmentOption}
            onPress={handleImagePicker}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.attachmentOptionGradient}
            >
              <ImageIcon size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.attachmentOptionText}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.attachmentOption}
            onPress={handleFilePicker}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.attachmentOptionGradient}
            >
              <Paperclip size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.attachmentOptionText}>File</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.attachmentOption}
            onPress={onCameraPress}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.attachmentOptionGradient}
            >
              <Camera size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.attachmentOptionText}>
              Live Cam
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Attachment Button */}
        <TouchableOpacity 
          style={[
            styles.attachmentButton,
            showAttachments && styles.attachmentButtonActive
          ]}
          onPress={toggleAttachments}
          disabled={disabled}
        >
          <Paperclip size={24} color="#6B7280" />
        </TouchableOpacity>
        
        {/* Text Input */}
        <View style={[styles.textInputContainer, { height: inputHeight + 16 }]}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, { height: inputHeight }]}
            value={inputText}
            onChangeText={handleTextChange}
            onContentSizeChange={handleContentSizeChange}
            placeholder="Type a message, or use voice/camera..."
            placeholderTextColor="#6B7280"
            multiline
            maxLength={1000}
            editable={!disabled}
            onSubmitEditing={handleSendText}
            blurOnSubmit={false}
          />
          
          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>AI is preparing response...</Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Send Button (when text is present) */}
          {inputText.trim().length > 0 ? (
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSendText}
              disabled={disabled}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.sendButtonGradient}
              >
                <Send size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            /* Voice Button (when no text) */
            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={onVoicePress}
              disabled={disabled}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.voiceButtonGradient}
              >
                <Mic size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Status Text */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {disabled ? 'Chat disabled' :
           'Voice ready • Type or speak'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    paddingTop: 12,
    paddingBottom: 8,
  },
  attachmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  attachmentOption: {
    alignItems: 'center',
  },
  attachmentOptionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  attachmentOptionText: {
    fontSize: 12,
    color: '#F3F4F6',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachmentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#374151',
  },
  attachmentButtonActive: {
    backgroundColor: '#4B5563',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 56,
    justifyContent: 'center',
  },
  textInput: {
    color: '#F3F4F6',
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  typingIndicator: {
    position: 'absolute',
    bottom: -20,
    left: 16,
  },
  typingText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionButtons: {
    alignItems: 'flex-end',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  voiceButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});