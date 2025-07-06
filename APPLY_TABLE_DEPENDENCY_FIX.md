# Apply Table Dependency Fix

## Problem
You're getting this error when trying to drop messaging tables:
```
ERROR: 2BP01: cannot drop table conversation_participants because other objects depend on it
DETAIL: policy conversations_select_policy on table conversations depends on table conversation_participants
```

## Solution
Run the `fix-table-dependencies.sql` script in your Supabase SQL Editor.

## Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Fix Script**
   - Copy the contents of `fix-table-dependencies.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **What the Script Does**
   - Drops all dependent policies first (prevents dependency errors)
   - Drops all functions and triggers
   - Disables RLS temporarily
   - Drops tables in correct order using CASCADE
   - Recreates tables with proper structure
   - Creates non-recursive policies using a helper function
   - Re-enables RLS and sets up proper permissions

4. **Verify the Fix**
   - The messaging system should now work without infinite recursion errors
   - Tables can be dropped and recreated without dependency issues
   - All policies use the helper function to prevent circular references

## Key Changes
- **Helper Function**: `is_conversation_participant()` prevents policy recursion
- **Proper Drop Order**: Policies → Functions → Triggers → Tables
- **CASCADE Usage**: Ensures all dependencies are handled
- **Simple Policies**: No circular references between tables

## After Running
Your messaging system will be fully functional with:
- ✅ No infinite recursion errors
- ✅ Proper table dependencies
- ✅ Working conversation creation
- ✅ Real-time message updates
- ✅ Secure row-level security policies