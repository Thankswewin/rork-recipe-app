import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';
import { supabase } from '../../../../lib/supabase';

export const createConversationProcedure = protectedProcedure
  .input(z.object({
    participantIds: z.array(z.string()),
    title: z.string().optional(),
  })) 
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    const { participantIds, title } = input;
    
    // Create the conversation
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert([{ title }])
      .select('id')
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      throw new Error(`Failed to create conversation: ${conversationError.message}`);
    }

    const conversationId = conversationData.id;

    // Add participants including the creator
    const allParticipantIds = [...new Set([ctx.user.id, ...participantIds])];
    const participants = allParticipantIds.map(userId => ({
      conversation_id: conversationId,
      user_id: userId
    }));

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      // Rollback conversation creation if participants insertion fails
      await supabase.from('conversations').delete().eq('id', conversationId);
      throw new Error(`Failed to add participants: ${participantsError.message}`);
    }

    return { conversationId };
  });
