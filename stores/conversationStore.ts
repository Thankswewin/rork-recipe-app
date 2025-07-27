import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { errorHandler, handleAsync, AppError } from '../lib/error-handler';

// Safe platform detection
const isWeb = () => {
  try {
    return Platform.OS === 'web';
  } catch {
    return typeof window !== 'undefined';
  }
};

interface Conversation {
  id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  updated_at: string;
}

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: AppError | null;
  
  // Actions
  createOrGetConversation: (userId: string, otherUserId: string) => Promise<{ conversationId?: string; error?: string }>;
  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, content: string, messageType?: 'text' | 'image' | 'file') => Promise<{ error?: string }>;
  setCurrentConversation: (conversationId: string | null) => void;
  clearMessages: (conversationId?: string) => void;
  setError: (error: AppError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      messages: {},
      isLoading: false,
      error: null,

      createOrGetConversation: async (userId: string, otherUserId: string) => {
        if (!userId) return { error: 'Not authenticated' };
        if (userId === otherUserId) {
          return { error: 'Cannot create conversation with yourself' };
        }

        set({ isLoading: true, error: null });

        try {
          console.log('ConversationStore: Creating/getting conversation between:', userId, 'and', otherUserId);
          
          // Use the RPC function to find existing conversation
          const { data: existingConversation, error: rpcError } = await supabase
            .rpc('find_conversation_between_users', {
              user1_id: userId,
              user2_id: otherUserId
            });

          if (!rpcError && existingConversation) {
            console.log('ConversationStore: Found existing conversation:', existingConversation);
            set({ isLoading: false });
            return { conversationId: existingConversation };
          }

          if (rpcError && rpcError.code !== '42883') {
            console.error('ConversationStore: RPC error:', rpcError);
            set({ isLoading: false });
            
            if (rpcError.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: 'Failed to check existing conversations' };
          }

          console.log('ConversationStore: No existing conversation found, creating new one');

          // Create new conversation
          const { data: newConversation, error: conversationError } = await supabase
            .from('conversations')
            .insert({
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (conversationError) {
            console.error('ConversationStore: Error creating conversation:', conversationError);
            set({ isLoading: false });
            
            if (conversationError.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: 'Failed to create conversation' };
          }

          console.log('ConversationStore: Created new conversation:', newConversation.id);

          // Add both users as participants
          const { error: participantsError } = await supabase
            .from('conversation_participants')
            .insert([
              { conversation_id: newConversation.id, user_id: userId },
              { conversation_id: newConversation.id, user_id: otherUserId },
            ]);

          if (participantsError) {
            console.error('ConversationStore: Error adding participants:', participantsError);
            // Clean up the conversation if participants couldn't be added
            await supabase.from('conversations').delete().eq('id', newConversation.id);
            set({ isLoading: false });
            
            if (participantsError.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: 'Failed to create conversation' };
          }

          console.log('ConversationStore: Successfully created conversation with participants');
          
          // Add to local state
          set(state => ({
            conversations: [newConversation, ...state.conversations],
            isLoading: false
          }));
          
          return { conversationId: newConversation.id };
        } catch (error: any) {
          console.error('ConversationStore: Error creating conversation:', error);
          const appError = errorHandler.handle(error);
          set({ isLoading: false, error: appError });
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: error.message || 'Failed to create conversation' };
        }
      },

      fetchConversations: async (userId: string) => {
        if (!userId) return;
        
        set({ isLoading: true, error: null });
        
        try {
          console.log('ConversationStore: Fetching conversations for user:', userId);
          
          const { data, error } = await supabase
            .from('conversations')
            .select(`
              *,
              participants:conversation_participants(
                user_id,
                profiles(
                  id,
                  username,
                  full_name,
                  avatar_url
                )
              )
            `)
            .eq('conversation_participants.user_id', userId)
            .order('last_message_at', { ascending: false });

          if (error) {
            console.error('ConversationStore: Error fetching conversations:', error);
            const appError = errorHandler.handle(error);
            set({ isLoading: false, error: appError });
            return;
          }

          console.log(`ConversationStore: Fetched ${data?.length || 0} conversations`);
          set({ 
            conversations: data || [],
            isLoading: false
          });
        } catch (error) {
          console.error('ConversationStore: Error fetching conversations:', error);
          const appError = errorHandler.handle(error);
          set({ 
            conversations: [],
            isLoading: false,
            error: appError
          });
        }
      },

      fetchMessages: async (conversationId: string) => {
        if (!conversationId) return;
        
        set({ isLoading: true, error: null });
        
        try {
          console.log('ConversationStore: Fetching messages for conversation:', conversationId);
          
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(100);

          if (error) {
            console.error('ConversationStore: Error fetching messages:', error);
            const appError = errorHandler.handle(error);
            set({ isLoading: false, error: appError });
            return;
          }

          console.log(`ConversationStore: Fetched ${data?.length || 0} messages`);
          set(state => ({ 
            messages: {
              ...state.messages,
              [conversationId]: data || []
            },
            isLoading: false
          }));
        } catch (error) {
          console.error('ConversationStore: Error fetching messages:', error);
          const appError = errorHandler.handle(error);
          set({ isLoading: false, error: appError });
        }
      },

      sendMessage: async (conversationId: string, senderId: string, content: string, messageType = 'text') => {
        if (!conversationId || !senderId || !content.trim()) {
          return { error: 'Missing required fields' };
        }

        try {
          console.log('ConversationStore: Sending message to conversation:', conversationId);
          
          const { data, error } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: senderId,
              content: content.trim(),
              message_type: messageType
            })
            .select(`
              *,
              sender:profiles(
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .single();

          if (error) {
            console.error('ConversationStore: Error sending message:', error);
            
            if (error.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: 'Failed to send message' };
          }

          // Update conversation's last_message_at
          await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);

          // Add message to local state
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), data]
            }
          }));

          console.log('ConversationStore: Message sent successfully');
          return {};
        } catch (error: any) {
          console.error('ConversationStore: Error sending message:', error);
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: error.message || 'Failed to send message' };
        }
      },

      setCurrentConversation: (conversationId: string | null) => {
        set({ currentConversationId: conversationId });
      },

      clearMessages: (conversationId?: string) => {
        if (conversationId) {
          set(state => {
            const newMessages = { ...state.messages };
            delete newMessages[conversationId];
            return { messages: newMessages };
          });
        } else {
          set({ messages: {} });
        }
      },

      setError: (error: AppError | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'conversation-storage',
      storage: createJSONStorage(() => {
        if (isWeb()) {
          return {
            getItem: (name: string) => {
              try {
                return localStorage.getItem(name);
              } catch {
                return null;
              }
            },
            setItem: (name: string, value: string) => {
              try {
                localStorage.setItem(name, value);
              } catch {
                // Ignore errors
              }
            },
            removeItem: (name: string) => {
              try {
                localStorage.removeItem(name);
              } catch {
                // Ignore errors
              }
            },
          };
        }
        return AsyncStorage;
      }),
      partialize: (state) => ({
        currentConversationId: state.currentConversationId,
        // Don't persist conversations and messages as they should be fresh
      }),
    }
  )
);