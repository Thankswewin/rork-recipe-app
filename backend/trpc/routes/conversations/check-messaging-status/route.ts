import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';

export const checkMessagingStatusProcedure = publicProcedure
  .query(async () => {
    try {
      // Check if conversations table exists and is accessible
      const { error: conversationsError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      if (conversationsError) {
        console.error('Conversations table check failed:', conversationsError);
        return {
          success: false,
          message: `Conversations table error: ${conversationsError.message}`,
          error: conversationsError
        };
      }

      // Check if conversation_participants table exists and is accessible
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .select('id')
        .limit(1);

      if (participantsError) {
        console.error('Conversation participants table check failed:', participantsError);
        return {
          success: false,
          message: `Conversation participants table error: ${participantsError.message}`,
          error: participantsError
        };
      }

      // Check if messages table exists and is accessible
      const { error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .limit(1);

      if (messagesError) {
        console.error('Messages table check failed:', messagesError);
        return {
          success: false,
          message: `Messages table error: ${messagesError.message}`,
          error: messagesError
        };
      }

      // Check if RPC function exists
      const { error: rpcError } = await supabase
        .rpc('find_conversation_between_users', {
          user1_id: '00000000-0000-0000-0000-000000000000',
          user2_id: '00000000-0000-0000-0000-000000000001'
        });

      // RPC error is expected for non-existent users, but function should exist
      if (rpcError && rpcError.code === '42883') {
        return {
          success: false,
          message: 'RPC function find_conversation_between_users does not exist',
          error: rpcError
        };
      }

      return {
        success: true,
        message: 'Messaging system is properly configured and accessible'
      };
    } catch (error: any) {
      console.error('Messaging status check error:', error);
      return {
        success: false,
        message: `Unexpected error: ${error.message}`,
        error
      };
    }
  });