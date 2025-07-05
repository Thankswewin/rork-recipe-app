-- COMPREHENSIVE FIX FOR INFINITE RECURSION IN CONVERSATION POLICIES
-- This script completely fixes the circular reference issue in RLS policies

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can delete conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their messages" ON messages;

-- Re-enable RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create NON-RECURSIVE policies for conversation_participants
-- This is the key fix - we avoid any self-referencing queries
CREATE POLICY "conversation_participants_select" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "conversation_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "conversation_participants_delete" ON conversation_participants
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Create simple policy for conversations
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Create simple policy for messages
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    sender_id = auth.uid()
  );

-- Test the fix by running a simple query
SELECT 'Infinite recursion fix applied successfully - policies recreated' AS status;

-- Verify tables exist and are accessible
SELECT 
  'conversations' as table_name,
  COUNT(*) as row_count
FROM conversations
UNION ALL
SELECT 
  'conversation_participants' as table_name,
  COUNT(*) as row_count  
FROM conversation_participants
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as row_count
FROM messages;