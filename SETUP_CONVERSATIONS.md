# Setup Conversations Tables

The messaging system requires conversation tables that may not exist in your database yet.

## Quick Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content of create-conversations-tables.sql
```

Or simply copy the content from `create-conversations-tables.sql` and run it in your Supabase dashboard.

## What this creates:

1. **conversations** table - stores conversation metadata
2. **conversation_participants** table - links users to conversations  
3. **messages** table - stores actual messages
4. **Row Level Security policies** - ensures users can only access their own conversations
5. **Indexes** - for better performance
6. **Realtime subscriptions** - for live messaging
7. **Triggers** - to update conversation timestamps

## After running the SQL:

The messaging system should work properly and you should be able to:
- Create conversations between users
- Send and receive messages
- View conversation lists

## Verification:

After running the SQL, test the messaging by:
1. Going to a user profile
2. Clicking the message button
3. Sending a test message