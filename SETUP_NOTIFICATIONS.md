# Setup Notifications System

## Step 1: Create the Notifications Table

Run this SQL script in your Supabase SQL editor:

```sql
-- Run the create-notifications-table.sql file
```

Copy and paste the entire content of `create-notifications-table.sql` into your Supabase SQL editor and execute it.

## Step 2: Verify the Table Creation

After running the script, verify that the notifications table was created:

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. You should see a "notifications" table with the following columns:
   - id (UUID, Primary Key)
   - user_id (UUID, Foreign Key to auth.users)
   - actor_id (UUID, Foreign Key to profiles)
   - type (TEXT with check constraint)
   - title (TEXT)
   - message (TEXT)
   - data (JSONB)
   - read (BOOLEAN, default false)
   - created_at (TIMESTAMP)

## Step 3: Test the Notification System

1. Make sure you have at least 2 user accounts
2. Sign in with one account
3. Follow another user
4. Check if a notification appears for the followed user
5. Test the notification button on the home screen

## Step 4: Troubleshooting

If you still get errors:

1. Check if the profiles table exists and has the correct structure
2. Verify that the followers table exists
3. Make sure RLS policies are enabled
4. Check the Supabase logs for any errors

## What This Fixes

- Creates the missing notifications table
- Sets up proper foreign key relationships
- Enables Row Level Security (RLS)
- Creates triggers for automatic notification creation
- Fixes TypeScript errors in the auth store
- Sets up realtime subscriptions for live notifications