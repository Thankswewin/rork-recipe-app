import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { trpcClient } from '@/lib/trpc';

import { useAuth } from '@/stores/authStore';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface Participant {
  id: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const user = useAuth((state) => state.user);

  useEffect(() => {
    if (!user) return;

    const fetchConversationData = async () => {
      try {
        // Fetch messages with explicit relationship to profiles
  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select(`
      id, conversation_id, sender_id, content, created_at,
      profiles!messages_sender_id_fkey (id, username, full_name, avatar_url)
    `)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          throw new Error(`Error fetching messages: ${messagesError.message}`);
        }

        setMessages(messagesData || []);

        // Fetch participants with explicit relationship to profiles
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            id, user_id,
            profiles!conversation_participants_user_id_fkey (id, username, full_name, avatar_url)
          `)
          .eq('conversation_id', id);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          throw new Error(`Error fetching participants: ${participantsError.message}`);
        }

        setParticipants(participantsData || []);
      } catch (err) {
        console.error('Error in fetchConversationData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversation data');
      }
    };

    fetchConversationData();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, async (payload) => {
        // Fetch the full message data including the sender profile
        const { data: newMessageData, error } = await supabase
          .from('messages')
          .select(`
            id, conversation_id, sender_id, content, created_at,
            profiles!messages_sender_id_fkey (id, username, full_name, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();

        if (error) {
          console.error('Error fetching new message details:', error);
          return;
        }

        setMessages(prev => [...prev, newMessageData]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: id,
          sender_id: user.id,
          content: newMessage
        }]);

      if (error) throw error;
      setNewMessage('');
      // Update conversation last message timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.sender_id === user?.id ? styles.sent : styles.received]}>
      <Text style={styles.sender}>{item.profiles?.username || 'Unknown'}</Text>
      <Text style={styles.message}>{item.content}</Text>
      <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString()}</Text>
    </View>
  );

  const conversationTitle = participants.length > 0 
    ? participants
        .filter(p => p.user_id !== user?.id)
        .map(p => p.profiles.username)
        .join(', ')
    : 'Conversation';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: conversationTitle }} />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  sent: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  received: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  sender: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#555',
  },
  message: {
    fontSize: 16,
  },
  time: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        paddingBottom: 30,
      },
    }),
  },
  input: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    padding: 10,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 10,
  },
});
