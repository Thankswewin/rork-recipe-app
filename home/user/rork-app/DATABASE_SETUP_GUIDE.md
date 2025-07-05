# Database Setup Guide

This guide will help you set up your Supabase database with all the necessary tables, policies, and storage buckets.

## Step 1: Create Tables

Go to your Supabase dashboard → SQL Editor and run these queries one by one:

### 1.1 Create Profiles Table
```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 1.2 Create Followers Table
```sql
-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Create policies for followers
CREATE POLICY "Users can view all followers" ON followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON followers
  FOR DELETE USING (auth.uid() = follower_id);

-- Add constraint to prevent self-following
ALTER TABLE followers ADD CONSTRAINT no_self_follow CHECK (follower_id != following_id);
```

### 1.3 Create Indexes for Performance
```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

## Step 2: Set Up Storage

### 2.1 Create Storage Bucket
Go to Supabase Dashboard → Storage and create a new bucket:
- Bucket name: `avatars`
- Public bucket: ✅ (checked)

### 2.2 Set Storage Policies
Go to Storage → avatars bucket → Policies and add these policies:

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow everyone to view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

## Step 3: Create Database Functions

### 3.1 Auto-create Profile Function
```sql
-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.2 Get Follower Counts Function
```sql
-- Function to get follower and following counts
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(
  followers_count BIGINT,
  following_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM followers WHERE following_id = user_id) as followers_count,
    (SELECT COUNT(*) FROM followers WHERE follower_id = user_id) as following_count;
END;
$$ LANGUAGE plpgsql;
```

## Step 4: Test Your Setup

After running all the above SQL commands, test your setup:

1. **Test Profile Creation**: Sign up a new user and check if a profile is automatically created
2. **Test Following**: Try following/unfollowing users
3. **Test Avatar Upload**: Try uploading a profile picture
4. **Test Policies**: Make sure users can only edit their own profiles

## Step 5: Verify Tables Exist

Run this query to verify all tables are created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'followers');
```

## Troubleshooting

If you encounter issues:

1. **Foreign Key Errors**: Make sure the profiles table exists before creating the followers table
2. **RLS Errors**: Ensure you're authenticated when testing
3. **Storage Errors**: Check that the avatars bucket exists and has the correct policies
4. **Permission Errors**: Verify your Supabase project has the necessary permissions

## Next Steps

After completing this setup:
1. Test the app functionality
2. Check that followers count updates correctly
3. Verify profile photo upload/replacement works
4. Test the followers/following lists display properly