import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';

export const getConversationsProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
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
        .eq('user_id', userId)
        .order('conversations(last_message_at)', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      if (!conversationData || conversationData.length === 0) {
        return [];
      }

      // For each conversation, get participants and last message
      const conversationsWithDetails = await Promise.all(
        conversationData.map(async (item: any) => {
          const conversation = item.conversations;
          
          // Get all participants
          const { data: participants, error: participantsError } = await supabase
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

          if (participantsError) {
            console.error('Error fetching participants:', participantsError);
          }

          // Get last message
          const { data: lastMessage, error: messageError } = await supabase
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
            .maybeSingle();

          if (messageError) {
            console.error('Error fetching last message:', messageError);
          }

          return {
            ...conversation,
            participants: participants || [],
            last_message: lastMessage || null,
          };
        })
      );

      return conversationsWithDetails;
    } catch (error: any) {
      console.error('Error in getConversations:', error);
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  });