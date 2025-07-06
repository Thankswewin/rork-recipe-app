import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Send } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

type MessageWithSender = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

type ParticipantWithUser = {
  id: string;
  user_id: string;
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [participants, setParticipants] = useState<ParticipantWithUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    if (!id || !user) return;

    const fetchMessages = async () => {
      try {
        // Fetch messages with sender information using a manual join
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        // Fetch sender profiles separately
        const senderIds = [...new Set(messagesData?.map(m => m.sender_id).filter(Boolean))];
        const { data: sendersData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', senderIds);

        // Combine messages with sender data
        const messagesWithSenders = messagesData?.map(message => ({
          ...message,
          sender: sendersData?.find(sender => sender.id === message.sender_id)
        })) || [];

        setMessages(messagesWithSenders);
      } catch (err) {
        console.error('Error fetching messages:', err);
        Alert.alert('Error', 'Failed to load messages');
      }
    };

    const fetchParticipants = async () => {
      try {
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('*')
          .eq('conversation_id', id);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          return;
        }

        // Fetch user profiles separately
        const userIds = participantsData?.map(p => p.user_id) || [];
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        // Combine participants with user data
        const participantsWithUsers = participantsData?.map(participant => ({
          ...participant,
          user: usersData?.find(user => user.id === participant.user_id)
        })) || [];

        setParticipants(participantsWithUsers);
      } catch (err) {
        console.error('Error fetching participants:', err);
      }
    };

    fetchMessages();
    fetchParticipants();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, async (payload) => {
        console.log('New message received:', payload);
        
        // Fetch sender profile for the new message
        const { data: senderData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', payload.new.sender_id)
          .single();

        const newMessageWithSender = {
          ...payload.new,
          sender: senderData
        } as MessageWithSender;

        setMessages((prev) => [...prev, newMessageWithSender]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !id || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id as string,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
        return;
      }

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', id);

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: MessageWithSender }) => {
    const isMyMessage = item.sender_id === user?.id;
    const senderName = item.sender?.full_name || item.sender?.username || 'Unknown';

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage 
            ? [styles.myMessage, { backgroundColor: colors.tint }]
            : [styles.otherMessage, { backgroundColor: colors.cardBackground }]
        ]}>
          {!isMyMessage && (
            <Text style={[styles.senderName, { color: colors.muted }]}>
              {senderName}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            { color: isMyMessage ? 'white' : colors.text }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestamp,
            { color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.muted }
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const otherParticipants = participants.filter(p => p.user_id !== user?.id);
  const conversationTitle = otherParticipants.length > 0 
    ? otherParticipants.map(p => p.user?.full_name || p.user?.username || 'Unknown').join(', ')
    : 'Conversation';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: conversationTitle,
          headerStyle: { backgroundColor: colors.cardBackground },
          headerTintColor: colors.text,
        }} 
      />
      
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.cardBackground,
        borderTopColor: colors.border 
      }]}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            color: colors.text 
          }]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, { 
            backgroundColor: newMessage.trim() ? colors.tint : colors.muted 
          }]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isLoading}
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});