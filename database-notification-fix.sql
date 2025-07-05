-- Fix notifications table foreign key relationship
-- Run this in your Supabase SQL editor

-- Drop existing foreign key constraint on actor_id
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

-- Add new foreign key constraint to reference profiles table instead of auth.users
ALTER TABLE notifications ADD CONSTRAINT notifications_actor_id_fkey 
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update the handle_new_follow function to ensure it works with the new constraint
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_follow_created ON followers;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON followers
  FOR EACH ROW EXECUTE FUNCTION handle_new_follow();

-- Test the notifications table structure
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='notifications'
  AND tc.table_schema='public';