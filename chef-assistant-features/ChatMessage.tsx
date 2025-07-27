import React, { useEffect, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Animated } from "react-native";
import { Text } from "./ui/Text";
import { colors } from "@/constants/colors";
import { Message } from "@/types";
import { formatMessageTime } from "@/utils/helpers";
import { Image } from "expo-image";
import { Modal } from "react-native";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import {
  spacing,
  typography,
  borderRadius,
  colorPalette,
  shadows,
} from '@/constants/designSystem';

type ChatMessageProps = {
  message: Message;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [loadingDots, setLoadingDots] = useState("");
  const [processingOpacity] = useState(new Animated.Value(0.3));
  const [processingScale] = useState(new Animated.Value(1));
  
  // Enhanced loading animation with pulsing red circle
  useEffect(() => {
    if (message.isLoading) {
      // Animate the processing indicator with red pulsing effect
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(processingOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(processingScale, {
              toValue: 1.3,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(processingOpacity, {
              toValue: 0.4,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(processingScale, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      
      blinkAnimation.start();
      
      // Animate the dots
      const interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === "...") return "";
          return prev + ".";
        });
      }, 400);
      
      return () => {
        blinkAnimation.stop();
        clearInterval(interval);
      };
    } else {
      setLoadingDots("");
      processingOpacity.setValue(1);
      processingScale.setValue(1);
    }
  }, [message.isLoading, processingOpacity, processingScale]);
  
  // Real-time typing animation for streaming responses
  useEffect(() => {
    if (message.role === "assistant" && message.isTyping) {
      // Use displayedContent from store for real-time updates
      setDisplayText(message.displayedContent || "");
    } else if (message.role === "assistant" && !message.isTyping && !message.isLoading) {
      // For completed messages, show full content
      setDisplayText(message.content);
    }
  }, [message.content, message.isTyping, message.displayedContent, message.isLoading]);
  
  // Determine what text to show
  const getTextToShow = () => {
    if (message.isLoading) {
      return "Processing";
    }
    
    if (message.isTyping) {
      return displayText;
    }
    
    return message.content;
  };
  
  const textToShow = getTextToShow();
  
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {isUser ? (
        // User message with bubble
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>
            {textToShow}
          </Text>
          
          {message.image && (
            <TouchableOpacity 
              onPress={() => setShowImagePreview(true)}
              style={styles.imageContainer}
            >
              <Image 
                source={{ uri: message.image }} 
                style={styles.image}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Assistant message flush with background
        <View style={styles.assistantContent}>
          {message.isLoading ? (
            <View style={styles.processingContainer}>
              <Animated.View style={[
                styles.processingIndicator,
                {
                  opacity: processingOpacity,
                  transform: [{ scale: processingScale }]
                }
              ]}>
                {/* Red pulsing circle as requested */}
                <View style={styles.processingCircle} />
                <Text style={styles.processingText}>
                  Processing{loadingDots}
                </Text>
              </Animated.View>
            </View>
          ) : (
            <Text style={[
              styles.assistantText,
              message.isTyping && styles.typingText
            ]}>
              {textToShow}
              {message.isTyping && !message.isLoading && textToShow && (
                <Text style={styles.cursor}>|</Text>
              )}
            </Text>
          )}
          
          {message.image && (
            <TouchableOpacity 
              onPress={() => setShowImagePreview(true)}
              style={styles.imageContainer}
            >
              <Image 
                source={{ uri: message.image }} 
                style={styles.image}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {!message.isLoading && (
        <Text variant="caption" color="textSecondary" style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {formatMessageTime(message.timestamp)}
        </Text>
      )}
      
      {message.image && (
        <Modal
          visible={showImagePreview}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImagePreview(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image source={{ uri: message.image }} style={styles.fullImage} />
              <Button
                variant="ghost"
                size="icon"
                icon={X}
                iconSize={24}
                iconColor={colors.white}
                onPress={() => setShowImagePreview(false)}
                style={styles.closeButton}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  assistantContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: "85%",
    ...shadows.sm,
  },
  userBubble: {
    backgroundColor: colorPalette.purple[600],
    borderBottomRightRadius: spacing.xs,
  },
  assistantContent: {
    maxWidth: "95%",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  userText: {
    color: colors.white,
    fontSize: typography.base,
    lineHeight: typography.lineHeights.relaxed * typography.base,
  },
  assistantText: {
    color: colors.text,
    fontSize: typography.base,
    lineHeight: typography.lineHeights.relaxed * typography.base,
    letterSpacing: 0.2,
  },
  typingText: {
    // Specific styling for typing text if needed
  },
  processingContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  processingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  processingCircle: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colorPalette.red[500],
    marginRight: spacing.sm,
  },
  processingText: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
  cursor: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: typography.weights.bold,
    opacity: 1,
  },
  timestamp: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.xs,
    fontSize: typography.xs,
    opacity: 0.6,
  },
  userTimestamp: {
    textAlign: "right",
  },
  assistantTimestamp: {
    textAlign: "left",
  },
  imageContainer: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.md,
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: borderRadius.full,
  },
});