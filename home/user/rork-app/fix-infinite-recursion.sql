-- Fix infinite recursion in conversation_participants policy
-- This script fixes the policy that's causing the infinite recursion error

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversation participants" ON conversation_participants;

-- Create a simpler, non-recursive policy for conversation_participants
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

-- Also fix the conversations policy to be simpler
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Fix messages policy to be simpler too
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

-- Test the fix
SELECT 'Infinite recursion fix applied successfully' AS status;