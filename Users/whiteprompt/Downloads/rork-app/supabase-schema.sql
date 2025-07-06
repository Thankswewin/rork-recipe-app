-- Drop existing policies and tables with CASCADE to remove dependencies
DROP POLICY IF EXISTS conversations_select_policy ON conversations;
DROP POLICY IF EXISTS conversations_update_policy ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can insert participants in conversations they participate in" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in conversations they participate in" ON conversation_participants;

-- Drop tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Recreate tables with proper structure
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  is_group BOOLEAN DEFAULT FALSE
);

CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Create policies with simplified, non-recursive logic
-- Conversations policies
CREATE POLICY "Users can view conversations they participate in"
  ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations they participate in"
  ON conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

-- Conversation participants policies
CREATE POLICY "Users can view participants in conversations they participate in"
  ON conversation_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert participants in conversations they participate in"
  ON conversation_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can send messages in conversations they participate in"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view messages in conversations they participate in"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Storage policy for avatar images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Avatar images are publicly accessible'
    AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Avatar images are publicly accessible"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END
$$;
