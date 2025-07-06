# Fix Infinite Recursion in Conversation Policies

## The Problem
You're getting this error:
```
ERROR: infinite recursion detected in policy for relation "conversation_participants"
```

This happens because the Row Level Security (RLS) policies are referencing each other in a circular way.

## The Solution
Run the SQL script below in your Supabase SQL Editor to fix this issue.

## Steps to Fix:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL script from `fix-infinite-recursion-final.sql`
4. Run the script
5. Test your messaging system

## What the Fix Does:
- Drops all problematic recursive policies
- Recreates tables with proper structure
- Creates simple, non-recursive policies
- Adds performance indexes
- Enables realtime subscriptions

After running this script, your messaging system should work without infinite recursion errors.