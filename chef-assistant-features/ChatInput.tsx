import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Platform } from "react-native";
import { Input } from "./ui/Input";
import { colors } from "@/constants/colors";
import { Send, Mic } from "lucide-react-native";

type ChatInputProps = {
  onSend: (message: string) => void;
  onVoiceInput?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export function ChatInput({
  onSend,
  onVoiceInput,
  placeholder = "Type a message...",
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <View style={styles.container}>
      <Input
        placeholder={placeholder}
        value={message}
        onChangeText={setMessage}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        disabled={disabled}
        containerStyle={styles.inputContainer}
        style={styles.input}
        rightIcon={
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || disabled}
            style={[
              styles.sendButton,
              (!message.trim() || disabled) && styles.disabledButton,
            ]}
          >
            <Send size={18} color={colors.white} />
          </TouchableOpacity>
        }
        onRightIconPress={handleSend}
        leftIcon={
          Platform.OS !== "web" && onVoiceInput ? (
            <TouchableOpacity
              onPress={onVoiceInput}
              disabled={disabled}
              style={styles.micButton}
            >
              <Mic size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  inputContainer: {
    marginBottom: 0,
  },
  input: {
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
  },
});