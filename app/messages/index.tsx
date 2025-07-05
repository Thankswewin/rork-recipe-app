import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { MessageCircle, Search } from "lucide-react-native";
import BackButton from "@/components/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import type { Conversation } from "@/types";

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get conversations where user is a participant
      const { data: conversationData, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner (
            id,
            created_at,
            updated_at,
            last_message_at
          )
        `)
        .eq('user_id', user.id)
        .order('conversations(last_message_at)', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      // For each conversation, get participants and last message
      const conversationsWithDetails = await Promise.all(
        (conversationData || []).map(async (item: any) => {
          const conversation = item.conversations;
          
          // Get all participants
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
            .eq('conversation_id', conversation.id);

          // Get last message
          const { data: lastMessage } = await supabase
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
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conversation,
            participants: participants || [],
            last_message: lastMessage || null,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationPress = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.user_id !== user?.id)?.user;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherParticipant(item);
    const displayName = otherUser?.full_name || otherUser?.username || 'Unknown User';
    const lastMessageText = item.last_message?.content || 'No messages yet';
    const lastMessageTime = item.last_message?.created_at || item.created_at;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => handleConversationPress(item.id)}
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri: otherUser?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
          }}
          style={styles.avatar}
        />
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.timestamp, { color: colors.muted }]}>
              {formatTime(lastMessageTime)}
            </Text>
          </View>
          <Text style={[styles.lastMessage, { color: colors.muted }]} numberOfLines={2}>
            {lastMessageText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Search size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Start a conversation by messaging someone from their profile
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  conversationsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 18,
  },
});