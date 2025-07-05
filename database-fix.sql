-- Complete database fix for followers system

-- First, drop the existing followers table to recreate it properly
DROP TABLE IF EXISTS public.followers CASCADE;

-- Create followers table with proper foreign key references to profiles
CREATE TABLE public.followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON public.followers(created_at);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all followers" ON public.followers;
DROP POLICY IF EXISTS "Users can insert their own follows" ON public.followers;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.followers;

-- Create RLS policies
CREATE POLICY "Users can view all followers" ON public.followers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own follows" ON public.followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.followers
  FOR DELETE USING (auth.uid() = follower_id);

-- Grant necessary permissions
GRANT ALL ON public.followers TO authenticated;

-- Add realtime subscription safely (only if not already added)
DO $$
BEGIN
  -- Try to add followers table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, ignore
      NULL;
  END;
END $$;

-- Create helper functions for follower counts
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.followers
    WHERE following_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.followers
    WHERE follower_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.followers
    WHERE followers.follower_id = is_following.follower_id
    AND followers.following_id = is_following.following_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_follower_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_following_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_following(UUID, UUID) TO authenticated;