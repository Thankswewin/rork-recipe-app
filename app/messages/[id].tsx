import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/stores/authStore';

type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: Profile;
};

type Participant = {
  id: string;
  user_id: string;
  profiles: Profile;
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, profiles(*)')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        if (data) {
          setMessages(data as unknown as Message[]);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('conversation_participants')
          .select('*, profiles(*)')
          .eq('conversation_id', id);

        if (error) {
          console.error('Error fetching participants:', error);
          return;
        }

        if (data) {
          setParticipants(data as unknown as Participant[]);
        }
      } catch (err) {
        console.error('Error fetching participants:', err);
      }
    };

    fetchMessages();
    fetchParticipants();

    const subscription = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: id,
            sender_id: user.id,
            content: newMessage,
          },
        ])
        .select('*, profiles(*)')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      if (data) {
        setMessages((prev) => [...prev, data as unknown as Message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={styles.messageContainer}>
      <Text style={styles.sender}>{item.profiles.username}</Text>
      <Text style={styles.message}>{item.content}</Text>
      <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversation</Text>
      <Text style={styles.subtitle}>
        Participants: {participants.map((p) => p.profiles.username).join(', ')}
      </Text>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  messagesList: {
    flex: 1,
    marginBottom: 16,
  },
  messageContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 8,
  },
});
