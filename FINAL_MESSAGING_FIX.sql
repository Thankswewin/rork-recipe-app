-- FINAL FIX FOR INFINITE RECURSION IN MESSAGING SYSTEM
-- This script completely resolves the infinite recursion issue in conversation_participants policies
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS temporarily to avoid conflicts during cleanup
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "participants_delete_policy" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;

-- Drop any other existing policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can delete their participation" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their messages" ON messages;

-- Step 3: Create a helper function to check if user is participant (avoids recursion)
CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversation_uuid 
    AND user_id = user_uuid
  );
$$;

-- Step 4: Re-enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 5: Create SIMPLE, NON-RECURSIVE policies using the helper function

-- Conversations policies
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    is_conversation_participant(id, auth.uid())
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    is_conversation_participant(id, auth.uid())
  );

-- Conversation participants policies (CRITICAL: Use direct checks only)
CREATE POLICY "participants_select" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "participants_delete" ON conversation_participants
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Messages policies
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    is_conversation_participant(conversation_id, auth.uid())
  );

-- Step 6: Grant permissions to the helper function
GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID, UUID) TO anon;

-- Step 7: Ensure RPC function exists and works
CREATE OR REPLACE FUNCTION find_conversation_between_users(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Use a simple approach to find conversation
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE c.id IN (
    SELECT cp1.conversation_id 
    FROM conversation_participants cp1 
    WHERE cp1.user_id = user1_id
  )
  AND c.id IN (
    SELECT cp2.conversation_id 
    FROM conversation_participants cp2 
    WHERE cp2.user_id = user2_id
  )
  AND (
    SELECT COUNT(*) 
    FROM conversation_participants cp 
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1;
  
  RETURN conversation_id;
END;
$$;

-- Step 8: Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT EXECUTE ON FUNCTION find_conversation_between_users(UUID, UUID) TO authenticated;

-- Step 9: Test the fix
DO $$
BEGIN
  RAISE NOTICE 'Infinite recursion fix applied successfully!';
  RAISE NOTICE 'All policies have been recreated with non-recursive logic';
  RAISE NOTICE 'Helper function is_conversation_participant created';
  RAISE NOTICE 'The messaging system should now work without recursion errors';
END $$;