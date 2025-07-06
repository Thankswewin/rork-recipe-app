-- Fix infinite recursion in conversation_participants policies
-- This error occurs when policies reference each other in a circular manner

-- First, drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can view their own participation records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert participation records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

-- Create simple, non-recursive policies for conversation_participants
CREATE POLICY "Users can view their own participation records" ON conversation_participants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own participation records" ON conversation_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create policy for conversations that doesn't reference conversation_participants
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update conversations they participate in" ON conversations
    FOR UPDATE USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Create policy for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Create function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid AS $$
DECLARE
    conversation_id uuid;
BEGIN
    -- Check if conversation already exists between these users
    SELECT c.id INTO conversation_id
    FROM conversations c
    WHERE c.id IN (
        SELECT cp1.conversation_id
        FROM conversation_participants cp1
        WHERE cp1.user_id = user1_id
        INTERSECT
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

    -- If no conversation exists, create one
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (id, created_at, updated_at, last_message_at)
        VALUES (gen_random_uuid(), NOW(), NOW(), NOW())
        RETURNING id INTO conversation_id;

        -- Add both users as participants
        INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
        VALUES 
            (conversation_id, user1_id, NOW()),
            (conversation_id, user2_id, NOW());
    END IF;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid) TO authenticated;