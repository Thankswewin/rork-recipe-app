import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';

export const createConversationProcedure = protectedProcedure
  .input(z.object({
    otherUserId: z.string().uuid(),
  }))
  .mutation(async ({ input, ctx }: { input: { otherUserId: string }, ctx: { user: { id: string } } }) => {
    const userId = ctx.user.id;
    const { otherUserId } = input;

    if (userId === otherUserId) {
      throw new Error('Cannot create conversation with yourself');
    }

    try {
      // Check if other user exists
      const { data: otherUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', otherUserId)
        .single();

      if (userError || !otherUser) {
        throw new Error('User not found');
      }

      // Use the database function to get or create conversation
      const { data: conversationId, error: functionError } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: userId,
          user2_id: otherUserId
        });

      if (functionError) {
        console.error('Error creating conversation:', functionError);
        throw new Error(`Failed to create conversation: ${functionError.message}`);
      }

      // Fetch the complete conversation data
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants (
            *,
            user:profiles!conversation_participants_user_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (fetchError) {
        console.error('Error fetching created conversation:', fetchError);
        throw new Error(`Failed to fetch conversation: ${fetchError.message}`);
      }

      return {
        ...conversation,
        participants: conversation.conversation_participants || [],
        last_message: null,
      };
    } catch (error: any) {
      console.error('Error in createConversation:', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  });