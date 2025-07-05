# Fix Conversations System

## Issue
The conversation system is failing because the database tables don't exist or have incorrect foreign key relationships.

## Solution
Run the SQL script to create the necessary tables and fix the relationships.

## Steps to Apply Fix

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to the SQL Editor

2. **Run the SQL Scripts**
   - First, copy the contents of `fix-conversations.sql`
   - Paste it into the SQL Editor and click "Run"
   - Then, copy the contents of `create-conversation-rpc.sql`
   - Paste it into the SQL Editor and click "Run"

3. **Verify the Fix**
   - Check that the tables were created:
     - `conversations`
     - `conversation_participants` 
     - `messages`
   - Verify foreign key relationships are working
   - Test the messaging functionality in the app

## What This Fix Does

1. **Creates Missing Tables**: Creates conversations, conversation_participants, and messages tables if they don't exist
2. **Sets Up RLS**: Enables Row Level Security with proper policies
3. **Creates Foreign Keys**: Establishes proper relationships with the profiles table
4. **Adds Indexes**: Improves query performance
5. **Sets Up Realtime**: Enables real-time subscriptions for live messaging
6. **Creates Triggers**: Automatically updates conversation timestamps when new messages are sent
7. **Creates RPC Function**: Efficiently finds existing conversations between users

## Expected Result
After applying this fix:
- Users can create conversations
- Messages can be sent and received
- Real-time messaging works
- Proper security policies are in place