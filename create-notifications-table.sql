-- Create notifications table if it doesn't exist
-- Run this in your Supabase SQL editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'recipe_created')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Create function to handle new follows and create notifications
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
  FROM public.profiles
  WHERE id = NEW.follower_id;

  -- Create notification for the user being followed
  INSERT INTO public.notifications (user_id, actor_id, type, title, message, data)
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

-- Create trigger for new follows (only if followers table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followers' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS on_follow_created ON public.followers;
    CREATE TRIGGER on_follow_created
      AFTER INSERT ON public.followers
      FOR EACH ROW EXECUTE FUNCTION handle_new_follow();
  END IF;
END $$;

-- Add notifications table to realtime publication safely
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, ignore
      NULL;
  END;
END $$;

-- Test the table creation
SELECT 'Notifications table created successfully' AS status;