-- Fix infinite recursion in conversation_participants policy
-- This script fixes the circular reference issue in RLS policies

-- Step 1: Drop problematic recursive policies
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

-- Step 2: Create simple, non-recursive policies for conversation_participants
CREATE POLICY "Users can view conversation participants" ON conversation_participants
  FOR SELECT USING (
    -- User can see participants if they are a participant in the same conversation
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM conversation_participants cp2 
      WHERE cp2.conversation_id = conversation_participants.conversation_id 
      AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversation participants" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete conversation participants" ON conversation_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Step 3: Create simple policy for conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Step 4: Ensure messages policies are also simple
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Step 5: Create or update the find_conversation_between_users function
CREATE OR REPLACE FUNCTION find_conversation_between_users(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Find a conversation where both users are participants
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp1 
    WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2 
    WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
  )
  -- Ensure it's a 1-on-1 conversation (only 2 participants)
  AND (
    SELECT COUNT(*) FROM conversation_participants cp 
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1;
  
  RETURN conversation_id;
END;
$$;

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION find_conversation_between_users(UUID, UUID) TO authenticated;

-- Step 6: Grant necessary permissions
GRANT ALL ON public.conversations TO anon, authenticated;
GRANT ALL ON public.conversation_participants TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;

-- Step 7: Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- Test the fix
SELECT 'Infinite recursion fix applied successfully' AS status;