# Database Fix Instructions

## Issue
The followers system is experiencing foreign key relationship errors and realtime publication conflicts because the database schema is not properly configured.

## Solution
Run the `database-fix.sql` script in your Supabase SQL editor to:

1. Drop and recreate the followers table with proper foreign key relationships
2. Set up correct RLS policies
3. Create helper functions for follower counts
4. Grant proper permissions
5. Safely add tables to realtime publication (handles existing tables)

## Steps to Apply

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database-fix.sql`
4. Run the script
5. Restart your app

## What This Fixes

- **Realtime Publication Error**: Uses safe DO blocks to handle tables already in publication
- Foreign key relationship errors between followers and profiles tables
- Follow/unfollow functionality not working properly
- Follower counts not updating correctly
- Profile images not displaying properly (cache busting)
- Synchronization issues between search and profile screens

## Error Handling

The updated scripts now handle these common errors:
- `relation "profiles" is already member of publication "supabase_realtime"`
- `duplicate_object` errors when adding tables to realtime
- Foreign key constraint violations
- RLS policy conflicts

## After Applying

The following should work correctly:
- Following/unfollowing users from search screen
- Following/unfollowing users from profile screen
- Follower counts updating in real-time
- Profile images displaying and updating properly
- Followers/following lists showing correct data
- Real-time notifications for follows
- No more database publication errors

## Safe to Re-run

All scripts are now idempotent and can be run multiple times safely without errors.