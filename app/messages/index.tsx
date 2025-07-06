import React from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { MessageCircle, Search, AlertCircle, Users } from "lucide-react-native";
import BackButton from "@/components/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { trpc } from "@/lib/trpc";
import type { Conversation } from "@/types";

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = trpc.conversations.getConversations.useQuery(undefined, {
    enabled: !!user,
    retry: (failureCount: number, error: any) => {
      // Don't retry on infinite recursion errors
      if (error?.data?.httpStatus === 500 && error?.message?.includes('infinite recursion')) {
        return false;
      }
      if (error?.data?.httpStatus === 500 && error?.message?.includes('42P17')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const handleConversationPress = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.user_id !== user?.id)?.user;
  };

  const getErrorMessage = (error: any) => {
    if (error?.message?.includes('infinite recursion') || error?.message?.includes('42P17')) {
      return 'Messaging system is temporarily unavailable due to a configuration issue. Please contact support to fix the database policies.';
    }
    if (error?.message?.includes('42P01') || error?.message?.includes('does not exist')) {
      return 'Messaging system is not set up yet. Please contact support to set up the database tables.';
    }
    if (error?.message?.includes('Messaging system is temporarily unavailable')) {
      return 'Messaging system is temporarily unavailable due to a configuration issue. Please contact support.';
    }
    return error?.message || 'Failed to load conversations. Please try again.';
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

  const renderError = () => (
    <View style={styles.errorContainer}>
      <AlertCircle size={64} color={colors.muted} />
      <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to Load Messages</Text>
      <Text style={[styles.errorSubtitle, { color: colors.muted }]}>
        {getErrorMessage(error)}
      </Text>
      {!error?.message?.includes('configuration issue') && !error?.message?.includes('not set up yet') && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.tint }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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

      {error ? (
        renderError()
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Start a conversation by finding users to message
          </Text>
          <TouchableOpacity
            style={[styles.searchUsersButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push("/(tabs)/search")}
          >
            <Users size={16} color="white" />
            <Text style={styles.searchUsersButtonText}>Find Users to Message</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refetch()}
              tintColor={colors.tint}
            />
          }
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 24,
  },
  searchUsersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchUsersButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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