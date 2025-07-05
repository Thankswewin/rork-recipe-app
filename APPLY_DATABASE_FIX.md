# Database Fix Instructions

## Issue
The followers system is experiencing foreign key relationship errors because the database schema is not properly configured.

## Solution
Run the `database-fix.sql` script in your Supabase SQL editor to:

1. Drop and recreate the followers table with proper foreign key relationships
2. Set up correct RLS policies
3. Create helper functions for follower counts
4. Grant proper permissions

## Steps to Apply

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database-fix.sql`
4. Run the script
5. Restart your app

## What This Fixes

- Foreign key relationship errors between followers and profiles tables
- Follow/unfollow functionality not working properly
- Follower counts not updating correctly
- Profile images not displaying properly (cache busting)
- Synchronization issues between search and profile screens

## After Applying

The following should work correctly:
- Following/unfollowing users from search screen
- Following/unfollowing users from profile screen
- Follower counts updating in real-time
- Profile images displaying and updating properly
- Followers/following lists showing correct data