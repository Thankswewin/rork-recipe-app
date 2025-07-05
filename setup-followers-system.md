# Setup Followers System

## 1. Database Setup

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of create-followers-table.sql
```

Or you can run it directly from the file:
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `create-followers-table.sql`
4. Paste and run the script

## 2. Storage Setup (for profile images)

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `avatars`
3. Set the bucket to public
4. Add the following policies to the `avatars` bucket:

### Storage Policies:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow everyone to view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 3. Test the Setup

After running the SQL script, use the Debug component in your app to test:
1. Test Connection - should show "Connection test successful"
2. Test Follow - should work without errors
3. The followers table error should be resolved

## 4. Features Enabled

After setup, your app will have:
- ✅ Follow/Unfollow users
- ✅ View followers and following lists
- ✅ Profile image upload/update
- ✅ User search functionality
- ✅ Real-time follower counts
- ✅ Proper data synchronization

## Troubleshooting

If you still see errors:
1. Make sure you're using the correct Supabase URL and anon key
2. Check that RLS is enabled on all tables
3. Verify that the authenticated user has the necessary permissions
4. Test the database connection using the Debug component