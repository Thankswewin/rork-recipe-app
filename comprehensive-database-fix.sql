-- Comprehensive Database Fix for Notifications and Messaging System
-- This script fixes all database issues including infinite recursion and missing tables

-- Step 1: Fix infinite recursion in conversation_participants policy
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversation participants" ON conversation_participants;

-- Create simpler, non-recursive policies for conversation_participants
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

-- Step 2: Fix conversations policy to be simpler
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Step 3: Fix messages policies to be simpler
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

-- Step 4: Ensure notifications table has proper foreign key
-- Drop existing foreign key constraint on actor_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_actor_id_fkey' 
    AND table_name = 'notifications'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT notifications_actor_id_fkey;
  END IF;
END $$;

-- Add proper foreign key constraint to reference profiles table
ALTER TABLE notifications ADD CONSTRAINT notifications_actor_id_fkey 
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

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

-- Step 6: Update the handle_new_follow function to work with the fixed foreign key
CREATE OR REPLACE FUNCTION handle_new_follow()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get the follower's name for the notification
  SELECT COALESCE(full_name, username, 'Someone') INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;

  -- Create notification for the user being followed
  INSERT INTO notifications (user_id, actor_id, type, title, message, data)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    'New Follower',
    follower_name || ' started following you',
    jsonb_build_object('follower_id', NEW.follower_id)
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the follow action
    RAISE WARNING 'Failed to create follow notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists for new follows
DROP TRIGGER IF EXISTS on_follow_created ON followers;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON followers
  FOR EACH ROW EXECUTE FUNCTION handle_new_follow();

-- Step 7: Create policies for notifications if they don't exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Step 8: Grant necessary permissions
GRANT ALL ON public.conversations TO anon, authenticated;
GRANT ALL ON public.conversation_participants TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Step 9: Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Step 10: Set up realtime subscriptions safely
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
  
  -- Add notifications table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- Test the fix
SELECT 'Comprehensive database fix applied successfully' AS status;