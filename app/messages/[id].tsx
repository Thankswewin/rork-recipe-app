import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Send, Phone, Video } from "lucide-react-native";
import BackButton from "@/components/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import type { Message, Conversation } from "@/types";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { colors } = useTheme();
  const { user } = useAuthStore();

  useEffect(() => {
    if (id && user) {
      fetchConversation();
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [id, user]);

  const fetchConversation = async () => {
    if (!id || !user) return;

    try {
      const { data: conversationData, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return;
      }

      // Get participants
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          user:profiles!conversation_participants_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', id);

      setConversation({
        ...conversationData,
        participants: participants || [],
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      
      // Mark messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!id || !user) return;

    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', id)
        .neq('sender_id', user.id)
        .eq('read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!id) return;

    const subscription = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        async (payload) => {
          // Fetch the complete message with sender data
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data]);
            
            // Mark as read if not sent by current user
            if (data.sender_id !== user?.id) {
              await markMessagesAsRead();
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !id || !user || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: user.id,
          content: messageContent,
        });

      if (error) {
        console.error('Error sending message:', error);
        setNewMessage(messageContent); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    return conversation.participants.find(p => p.user_id !== user.id)?.user;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === user?.id;
    const showAvatar = !isMyMessage && (index === 0 || messages[index - 1]?.sender_id !== item.sender_id);
    const showTime = index === messages.length - 1 || 
      messages[index + 1]?.sender_id !== item.sender_id ||
      (new Date(messages[index + 1]?.created_at).getTime() - new Date(item.created_at).getTime()) > 300000; // 5 minutes

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {showAvatar && !isMyMessage && (
          <Image
            source={{
              uri: item.sender?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage 
            ? { backgroundColor: colors.tint, marginLeft: showAvatar ? 0 : 40 }
            : { backgroundColor: colors.cardBackground, marginLeft: showAvatar ? 0 : 40 }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isMyMessage ? 'white' : colors.text }
          ]}>
            {item.content}
          </Text>
        </View>
        {showTime && (
          <Text style={[
            styles.messageTime,
            { color: colors.muted },
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatMessageTime(item.created_at)}
          </Text>
        )}
      </View>
    );
  };

  const otherUser = getOtherParticipant();
  const displayName = otherUser?.full_name || otherUser?.username || 'Unknown User';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <BackButton />
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => otherUser && router.push(`/user/${otherUser.id}`)}
          >
            <Image
              source={{
                uri: otherUser?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
              }}
              style={styles.headerAvatar}
            />
            <Text style={[styles.headerTitle, { color: colors.text }]}>{displayName}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Phone size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Video size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: newMessage.trim() ? colors.tint : colors.muted },
              isSending && { opacity: 0.6 }
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    flex: 1,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 4,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  myMessageTime: {
    textAlign: "right",
    marginRight: 8,
  },
  otherMessageTime: {
    textAlign: "left",
    marginLeft: 48,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});