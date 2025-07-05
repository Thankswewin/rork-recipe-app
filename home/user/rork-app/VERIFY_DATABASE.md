# Database Verification Guide

Use these SQL queries in your Supabase SQL Editor to verify your database is set up correctly.

## 1. Check if Tables Exist

```sql
-- Check if all required tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'followers')
ORDER BY table_name;
```

Expected result: You should see both `profiles` and `followers` tables.

## 2. Check Table Structure

### Profiles Table Structure
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Followers Table Structure
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'followers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 3. Check RLS Policies

```sql
-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'followers');
```

```sql
-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'followers')
ORDER BY tablename, policyname;
```

## 4. Check Storage Bucket

```sql
-- Check if avatars bucket exists
SELECT 
  id,
  name,
  public
FROM storage.buckets 
WHERE name = 'avatars';
```

## 5. Check Storage Policies

```sql
-- Check storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;
```

## 6. Test Data Insertion

### Test Profile Creation
```sql
-- This should work if you're authenticated
INSERT INTO profiles (id, email, full_name, bio) 
VALUES (auth.uid(), auth.email(), 'Test User', 'Test bio')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio;
```

### Test Follower Relationship (Replace UUIDs with actual user IDs)
```sql
-- Replace these UUIDs with actual user IDs from your profiles table
-- First, get some user IDs:
SELECT id, email, full_name FROM profiles LIMIT 5;

-- Then test following (replace the UUIDs):
INSERT INTO followers (follower_id, following_id) 
VALUES (
  'your-user-id-here',
  'target-user-id-here'
);
```

## 7. Test Functions

```sql
-- Test the user stats function (replace with actual user ID)
SELECT * FROM get_user_stats('your-user-id-here');
```

## 8. Check Constraints

```sql
-- Check if the no_self_follow constraint exists
SELECT 
  conname,
  contype,
  consrc
FROM pg_constraint 
WHERE conrelid = 'followers'::regclass
AND contype = 'c';
```

## Common Issues and Solutions

### Issue: "relation does not exist"
**Solution**: The table hasn't been created. Run the table creation SQL from the main guide.

### Issue: "permission denied for table"
**Solution**: RLS policies aren't set up correctly. Run the policy creation SQL.

### Issue: "violates check constraint"
**Solution**: You might be trying to follow yourself. The constraint prevents this.

### Issue: "duplicate key value violates unique constraint"
**Solution**: You're trying to follow someone you already follow.

## Success Indicators

✅ All tables exist and have correct structure
✅ RLS is enabled on both tables
✅ All policies are created
✅ Storage bucket exists and is public
✅ Storage policies allow proper access
✅ Functions are created and working
✅ Constraints prevent invalid data

If all checks pass, your database is ready!