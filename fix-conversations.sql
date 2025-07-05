-- First, let's check if the tables exist and create them if they don't
DO $$
BEGIN
  -- Check if conversations table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
    -- Create conversations table
    CREATE TABLE conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY "Users can view their conversations" ON conversations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM conversation_participants 
          WHERE conversation_id = conversations.id 
          AND user_id = auth.uid()
        )
      );
  END IF;

  -- Check if conversation_participants table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_participants') THEN
    -- Create conversation participants table
    CREATE TABLE conversation_participants (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(conversation_id, user_id)
    );
    
    -- Enable RLS
    ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their conversation participants" ON conversation_participants
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM conversation_participants cp 
          WHERE cp.conversation_id = conversation_participants.conversation_id 
          AND cp.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can manage their conversation participants" ON conversation_participants
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Check if messages table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
    -- Create messages table
    CREATE TABLE messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
      sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their messages" ON messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM conversation_participants 
          WHERE conversation_id = messages.conversation_id 
          AND user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can send messages" ON messages
      FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
          SELECT 1 FROM conversation_participants 
          WHERE conversation_id = messages.conversation_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create function to handle new messages and update conversation
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

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- Grant necessary permissions
GRANT ALL ON public.conversations TO anon, authenticated;
GRANT ALL ON public.conversation_participants TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- Set up realtime subscriptions safely
DO $$
BEGIN
  -- Add conversations table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
  
  -- Add messages table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- Add foreign key constraints for profiles table if they don't exist
DO $$
BEGIN
  -- Add foreign key for conversation_participants -> profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversation_participants_user_id_fkey' 
    AND table_name = 'conversation_participants'
  ) THEN
    ALTER TABLE conversation_participants 
    ADD CONSTRAINT conversation_participants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for messages -> profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_sender_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages 
    ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;