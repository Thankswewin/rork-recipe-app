# Messaging System Setup Guide

## Overview
This guide will help you set up the messaging system for your React Native app. The messaging system allows users to send direct messages to each other.

## Database Setup

### Step 1: Run the Database Fix Script
Execute the following SQL script in your Supabase SQL editor to set up the messaging system:

```sql
-- Run the contents of fix-messaging-system-complete.sql
```

This script will:
- Drop any existing messaging tables and policies
- Create new conversations, conversation_participants, and messages tables
- Set up proper Row Level Security (RLS) policies
- Create the get_or_create_conversation function
- Add necessary indexes for performance

### Step 2: Verify Setup
After running the script, you can verify the setup by:

1. Checking that the tables exist in your Supabase dashboard
2. Testing the messaging functionality in your app
3. Looking for any error messages in the console

## Features Included

### 1. Conversation Management
- Users can create conversations with other users
- Conversations are automatically created when users start messaging
- Duplicate conversations are prevented

### 2. Message Sending
- Users can send text messages in conversations
- Messages are stored with timestamps
- Real-time updates (can be added with Supabase subscriptions)

### 3. User Interface
- Clean, modern messaging interface
- Empty state when no conversations exist
- Error handling for database issues
- Search functionality to find users to message

### 4. Security
- Row Level Security (RLS) ensures users can only see their own conversations
- Users can only send messages in conversations they participate in
- Proper authentication checks

## Error Handling

The system includes comprehensive error handling for:
- Database connection issues
- Missing tables
- Policy configuration problems
- Authentication failures

## Usage

### Starting a Conversation
1. Go to the Search tab
2. Switch to "Users" search
3. Search for a user by username or name
4. Tap the message button on their profile
5. This will create a conversation and navigate to the chat

### Viewing Messages
1. Go to the Messages tab from the home screen
2. See all your conversations listed
3. Tap on a conversation to view messages
4. Send new messages using the chat interface

## Troubleshooting

### "Infinite recursion detected" Error
This means the database policies have a circular reference. Run the fix script to resolve this.

### "Table does not exist" Error
This means the messaging tables haven't been created yet. Run the setup script.

### "Authentication failed" Error
Make sure the user is properly logged in and the session is valid.

## Next Steps

After setting up the basic messaging system, you can enhance it with:
- Real-time message updates using Supabase subscriptions
- Message read receipts
- File/image sharing
- Push notifications for new messages
- Message search functionality
- Group conversations