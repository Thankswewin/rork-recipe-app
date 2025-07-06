import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore'; // Corrected import to useAuthStore

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
};

type Participant = {
  id: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const user = useAuthStore((state) => state.user); // Using useAuthStore to get user data

  useEffect(() => {
    if (!id || !user) return;

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

        setMessages(data || []);
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

        setParticipants(data || []);
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
    if (!newMessage.trim() || !user || !id) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: user.id,
          content: newMessage,
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={item.sender_id === user?.id ? styles.myMessage : styles.otherMessage}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversation</Text>
      <Text style={styles.participants}>
        Participants: {participants.map((p) => p.profiles.username).join(', ')}
      </Text>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
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
  participants: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  messageList: {
    flex: 1,
    marginBottom: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '80%',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});
