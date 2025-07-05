import React, { useRef, useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useChefAssistantStore } from "@/stores/chefAssistantStore";
import BackButton from "@/components/BackButton";
import GradientText from "@/components/GradientText";
import ChatMessage from "@/components/chef-assistant/ChatMessage";
import MultimodalChatInput from "@/components/chef-assistant/MultimodalChatInput";

export default function ChefAssistantChatScreen() {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    currentSession,
    messages,
    isTyping,
    selectedAgent,
    sendMessage,
  } = useChefAssistantStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.titleContainer}>
            <GradientText
              colors={["#EF4444", "#F59E0B", "#3B82F6"]}
              style={styles.title}
            >
              {selectedAgent?.name || 'Chef Assistant'}
            </GradientText>
            {currentSession && (
              <GradientText
                colors={["#10B981", "#059669"]}
                style={styles.sessionTitle}
              >
                {currentSession.recipeName}
              </GradientText>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onImagePress={(imageUri) => console.log('Image pressed:', imageUri)}
            />
          ))}
          
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={[styles.typingBubble, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text style={[styles.typingText, { color: colors.muted }]}>
                  {selectedAgent?.name} is thinking...
                </Text>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, { backgroundColor: colors.muted }]} />
                  <View style={[styles.dot, { backgroundColor: colors.muted }]} />
                  <View style={[styles.dot, { backgroundColor: colors.muted }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Chat Input */}
        <MultimodalChatInput
          onSendMessage={sendMessage}
          disabled={isTyping}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: 'center',
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  typingText: {
    fontSize: 14,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});