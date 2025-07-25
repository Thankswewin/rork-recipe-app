import React from "react";
import { StyleSheet, View, FlatList, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/colors";
import { useAppStore } from "@/store/appStore";
import { agents } from "@/constants/agents";
import { formatDate, truncateText } from "@/utils/helpers";
import { MessageSquare, Plus } from "lucide-react-native";
import { Button } from "@/components/ui/Button";

export default function ChatsScreen() {
  const chatSessions = useAppStore((state) => state.chatSessions);
  const setActiveChat = useAppStore((state) => state.setActiveChat);
  
  const chats = Object.values(chatSessions).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
  
  const handleChatPress = (chatId: string, agentId: string) => {
    setActiveChat(chatId);
    router.push(`/agent/${agentId}?chat=${chatId}`);
  };
  
  const handleNewChat = () => {
    router.push("/assistant");
  };
  
  const getLastMessage = (chatId: string) => {
    const chat = chatSessions[chatId];
    if (!chat || chat.messages.length <= 1) return "No messages yet";
    
    const userMessages = chat.messages.filter(m => m.role === "user");
    if (userMessages.length === 0) return "No messages yet";
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    return truncateText(lastUserMessage.content, 50);
  };
  
  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : "Assistant";
  };
  
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MessageSquare size={64} color={colors.textSecondary} />
      <Text variant="h3" style={styles.emptyTitle}>
        No chats yet
      </Text>
      <Text variant="body" color="textSecondary" style={styles.emptyText}>
        Start a conversation with one of our assistants
      </Text>
      <Button
        title="New Chat"
        onPress={handleNewChat}
        icon={<Plus size={20} color={colors.white} />}
        style={styles.newChatButton}
      />
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h2">Your Conversations</Text>
        <Button
          title="New Chat"
          size="small"
          onPress={handleNewChat}
          icon={<Plus size={16} color={colors.white} />}
        />
      </View>
      
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleChatPress(item.id, item.agentId)}
            activeOpacity={0.7}
          >
            <Card style={styles.chatCard}>
              <View style={styles.chatHeader}>
                <Text variant="h3" style={styles.chatTitle}>
                  {getAgentName(item.agentId)}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {formatDate(item.updatedAt)}
                </Text>
              </View>
              <Text variant="body2" color="textSecondary" numberOfLines={2} style={styles.lastMessage}>
                {getLastMessage(item.id)}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chatList}
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.background,
  },
  chatList: {
    padding: 16,
    flexGrow: 1,
  },
  chatCard: {
    marginBottom: 16,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chatTitle: {
    color: colors.text,
  },
  lastMessage: {
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    marginTop: 100,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 24,
  },
  newChatButton: {
    width: 200,
  },
});