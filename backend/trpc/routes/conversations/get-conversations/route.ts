import { protectedProcedure } from '../../../create-context';
import { supabase } from '../../../../lib/supabase';

export const getConversationsProcedure = protectedProcedure.query(async ({ ctx }) => {
  if (!ctx.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, title, created_at, updated_at, last_message_at,
      conversation_participants!conversation_participants_conversation_id_fkey (
        id, user_id,
        profiles!conversation_participants_user_id_fkey (id, username, full_name, avatar_url)
      ),
      messages!messages_conversation_id_fkey (
        id, content, created_at,
        sender_id,
        profiles!messages_sender_id_fkey (id, username, full_name, avatar_url)
      )
    `)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  // Filter conversations to only include those where the user is a participant
  const filteredData = data.filter(conversation => 
    conversation.conversation_participants.some(participant => participant.user_id === ctx.user.id)
  );

  return filteredData.map(conversation => ({
    ...conversation,
    participants: conversation.conversation_participants.map(p => p.profiles),
    lastMessage: conversation.messages.length > 0 
      ? {
          ...conversation.messages[conversation.messages.length - 1],
          sender: conversation.messages[conversation.messages.length - 1].profiles
        }
      : null
  }));
});
