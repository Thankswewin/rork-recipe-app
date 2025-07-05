-- Fix foreign key relationships for followers table

-- First, let's drop the existing followers table and recreate it with proper foreign keys
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

-- Create RLS policies
CREATE POLICY "Users can view all followers" ON public.followers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own follows" ON public.followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.followers
  FOR DELETE USING (auth.uid() = follower_id);

-- Grant necessary permissions
GRANT ALL ON public.followers TO authenticated;

-- Add realtime subscription safely
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;