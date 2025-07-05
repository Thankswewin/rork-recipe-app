# Database Setup Guide

## Fix Username Column Issue

The error you're experiencing is because the `username` column might not exist in your database or there's a schema mismatch. Follow these steps to fix it:

### Step 1: Run Database Migration

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-migration.sql` 
4. Click "Run" to execute the migration

This will:
- Add the `username` column if it doesn't exist
- Add a unique constraint to prevent duplicate usernames
- Create an index for better performance
- Update the trigger function to handle usernames properly

### Step 2: Verify the Migration

After running the migration, you can verify it worked by running this query in the SQL Editor:

```sql
-- Check if username column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND table_schema = 'public';
```

### Step 3: Test User Profile Features

After the migration, you should be able to:

1. **Set Username**: Users can set a unique username in their profile
2. **Search Users**: Other users can search by username or full name
3. **View Profiles**: Visit other users' profiles via `/user/[id]` routes
4. **Upload Avatars**: Users can upload profile pictures from their camera library
5. **Follow/Unfollow**: Users can follow each other
6. **Profile Stats**: View recipe count, followers, and following counts

### Step 4: Features Available

#### Profile Management
- Edit profile information (username, full name, bio)
- Upload avatar images (mobile only, web shows placeholder)
- Username availability checking
- Profile validation

#### User Discovery
- Search users by username or full name
- View user profiles with their recipes
- Follow/unfollow functionality
- User statistics (recipes, followers, following)

#### Social Features
- Follow other users
- View followers and following lists
- User recipe collections
- Profile sharing

### Troubleshooting

If you still get errors after running the migration:

1. **Check RLS Policies**: Ensure Row Level Security policies allow profile creation
2. **Verify Storage**: Make sure the `avatars` storage bucket exists
3. **Check Permissions**: Ensure authenticated users can read/write profiles

### Storage Setup

The app also uses Supabase Storage for avatars. Make sure you have:

1. **Avatars Bucket**: Created with public access
2. **Storage Policies**: Proper RLS policies for file upload/access
3. **File Size Limits**: Set appropriate limits (5MB for avatars)

The migration script in `supabase-schema.sql` should have created these, but you can verify in your Supabase Storage dashboard.