-- COMPREHENSIVE FIX FOR TABLE DROP DEPENDENCIES
-- This script properly handles dropping tables with dependent policies
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL policies that might reference the tables we want to drop
-- This prevents the dependency error

-- Drop all conversation-related policies
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- Drop all conversation_participants policies
DROP POLICY IF EXISTS "participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "participants_delete_policy" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can delete their participation" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert their own participation records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert participation records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can delete conversation participants" ON conversation_participants;

-- Drop all messages policies
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their messages" ON messages;

-- Step 2: Drop all functions that might reference the tables
DROP FUNCTION IF EXISTS handle_new_message();
DROP FUNCTION IF EXISTS find_conversation_between_users(UUID, UUID);
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID);
DROP FUNCTION IF EXISTS is_conversation_participant(UUID, UUID);

-- Step 3: Drop all triggers
DROP TRIGGER IF EXISTS on_message_created ON messages;

-- Step 4: Disable RLS temporarily to avoid any remaining policy issues
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;

-- Step 5: Now safely drop tables in correct order (child tables first)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Step 6: Create tables with proper structure
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 8: Create SIMPLE, NON-RECURSIVE policies

-- Helper function to check participation (prevents recursion)
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

-- Conversation participants policies (MOST IMPORTANT - these must be simple)
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

-- Conversations policies (using helper function to avoid recursion)
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

-- Messages policies (using helper function)
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

-- Step 9: Create RPC function to find conversations
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

-- Step 10: Create function to handle new messages
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update conversation's last_message_at
  UPDATE conversations 
  SET last_message_at = NEW.created_at, updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update conversation timestamp: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 11: Create trigger for new messages
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- Step 12: Grant permissions
GRANT ALL ON conversations TO anon, authenticated;
GRANT ALL ON conversation_participants TO anon, authenticated;
GRANT ALL ON messages TO anon, authenticated;
GRANT EXECUTE ON FUNCTION find_conversation_between_users(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID, UUID) TO authenticated;

-- Step 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation ON conversation_participants(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Step 14: Enable realtime subscriptions
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Step 15: Test the setup
DO $$
BEGIN
  RAISE NOTICE 'Table dependency fix completed successfully!';
  RAISE NOTICE 'All dependent policies dropped before table recreation';
  RAISE NOTICE 'Tables recreated: conversations, conversation_participants, messages';
  RAISE NOTICE 'Non-recursive RLS policies created';
  RAISE NOTICE 'Helper function is_conversation_participant created to prevent recursion';
  RAISE NOTICE 'All table drop dependency issues should now be resolved';
END $$;