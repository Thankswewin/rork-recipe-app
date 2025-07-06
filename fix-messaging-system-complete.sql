-- Complete fix for messaging system infinite recursion and setup
-- This script will drop and recreate all messaging-related tables and policies

-- Drop existing policies and tables to start fresh
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can create conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid);

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversation_participants;
DROP TABLE IF EXISTS conversations;

-- Create conversations table
CREATE TABLE conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conversation_participants table
CREATE TABLE conversation_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Simple, non-recursive policies for conversations
CREATE POLICY "conversations_select_policy" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "conversations_insert_policy" ON conversations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Simple policies for conversation_participants
CREATE POLICY "participants_select_policy" ON conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "participants_insert_policy" ON conversation_participants
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR 
            conversation_id IN (
                SELECT conversation_id 
                FROM conversation_participants 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Simple policies for messages
CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Create function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_id uuid;
    existing_conversation_id uuid;
BEGIN
    -- Check if conversation already exists between these two users
    SELECT c.id INTO existing_conversation_id
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

    -- If conversation exists, return it
    IF existing_conversation_id IS NOT NULL THEN
        RETURN existing_conversation_id;
    END IF;

    -- Create new conversation
    INSERT INTO conversations (id, created_at, updated_at, last_message_at)
    VALUES (gen_random_uuid(), now(), now(), now())
    RETURNING id INTO conversation_id;

    -- Add both participants
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
    VALUES 
        (conversation_id, user1_id, now()),
        (conversation_id, user2_id, now());

    RETURN conversation_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Grant necessary permissions
GRANT SELECT, INSERT ON conversations TO authenticated;
GRANT SELECT, INSERT ON conversation_participants TO authenticated;
GRANT SELECT, INSERT ON messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid) TO authenticated;