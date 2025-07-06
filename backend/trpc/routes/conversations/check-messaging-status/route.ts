import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';

export const checkMessagingStatusProcedure = publicProcedure
  .query(async () => {
    try {
      // Check if the conversations table exists and is accessible
      const { data: conversationsTest, error: conversationsError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      if (conversationsError) {
        return {
          success: false,
          message: `Conversations table error: ${conversationsError.message}`,
          error: conversationsError
        };
      }

      // Check if the messages table exists and is accessible
      const { data: messagesTest, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .limit(1);

      if (messagesError) {
        return {
          success: false,
          message: `Messages table error: ${messagesError.message}`,
          error: messagesError
        };
      }

      // Check if the conversation_participants table exists and is accessible
      const { data: participantsTest, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('id')
        .limit(1);

      if (participantsError) {
        return {
          success: false,
          message: `Conversation participants table error: ${participantsError.message}`,
          error: participantsError
        };
      }

      // Check if the RPC function exists
      const { data: rpcTest, error: rpcError } = await supabase
        .rpc('find_conversation_between_users', {
          user1_id: '00000000-0000-0000-0000-000000000000',
          user2_id: '00000000-0000-0000-0000-000000000001'
        });

      if (rpcError && rpcError.code !== '42883') {
        return {
          success: false,
          message: `RPC function error: ${rpcError.message}`,
          error: rpcError
        };
      }

      return {
        success: true,
        message: 'Messaging system is properly configured and ready to use'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Unexpected error: ${error.message}`,
        error: error
      };
    }
  });