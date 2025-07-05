-- Fix followers table policies to allow proper follow/unfollow functionality

-- Drop existing followers policies
DROP POLICY IF EXISTS "Users can view followers" ON followers;
DROP POLICY IF EXISTS "Users can manage their own follows" ON followers;

-- Create better policies for followers table
-- Allow authenticated users to view all follower relationships
CREATE POLICY "Authenticated users can view followers" ON followers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to follow others (insert where they are the follower)
CREATE POLICY "Users can follow others" ON followers
  FOR INSERT WITH CHECK (
    auth.uid() = follower_id AND 
    follower_id != following_id -- Prevent self-follows
  );

-- Allow users to unfollow others (delete where they are the follower)
CREATE POLICY "Users can unfollow others" ON followers
  FOR DELETE USING (auth.uid() = follower_id);

-- Add constraint to prevent self-follows at database level
ALTER TABLE followers ADD CONSTRAINT no_self_follow CHECK (follower_id != following_id);