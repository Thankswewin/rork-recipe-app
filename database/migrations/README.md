# Database Migrations

This directory contains database migration files for the RORK Recipe App. These migrations should be applied to your Supabase database to set up the complete schema.

## Quick Start

### 1. Apply the Initial Schema

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of 001_initial_schema.sql
```

### 2. Verify the Migration

After running the migration, verify that all tables were created successfully:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'recipes', 'favorites', 'followers',
  'conversations', 'conversation_participants', 'messages', 'notifications'
);
```

You should see all 8 tables listed.

## Migration Files

### 001_initial_schema.sql

This is the complete initial database schema that includes:

- **Core Tables**: `profiles`, `recipes`, `favorites`, `followers`
- **Messaging System**: `conversations`, `conversation_participants`, `messages`
- **Notifications**: `notifications`
- **Security**: Row Level Security (RLS) policies for all tables
- **Performance**: Indexes for optimal query performance
- **Functions**: Helper functions for user registration and messaging
- **Triggers**: Automated timestamp updates and message handling
- **Storage**: Avatar upload policies
- **Realtime**: Subscriptions for live updates

## What This Migration Replaces

This consolidated migration replaces the following fragmented files:

- `supabase-schema.sql`
- `database-complete-fix.sql`
- `create-conversations-tables.sql`
- `create-followers-table.sql`
- `fix-messaging-system-complete.sql`
- `fix-infinite-recursion-policies.sql`
- Various other SQL fix files

## Features Enabled

✅ **User Management**: Complete profile system with authentication
✅ **Recipe System**: Full CRUD operations with categories and difficulty levels
✅ **Social Features**: Following/followers system
✅ **Favorites**: Users can save favorite recipes
✅ **Messaging**: Direct messaging between users
✅ **Notifications**: Real-time notification system
✅ **Security**: Comprehensive RLS policies
✅ **Performance**: Optimized indexes
✅ **Real-time**: Live updates for messages and notifications

## Troubleshooting

### If Migration Fails

1. **Check for existing tables**: Some tables might already exist. You can either:
   - Drop existing tables first (⚠️ **WARNING**: This will delete all data)
   - Modify the migration to use `CREATE TABLE IF NOT EXISTS`

2. **Permission errors**: Ensure you're running the migration as a database owner or with sufficient privileges.

3. **Extension errors**: Make sure the required PostgreSQL extensions are available:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

### Verify RLS Policies

Check that Row Level Security is properly enabled:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### Test Realtime Subscriptions

Verify that realtime is working:

```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## Next Steps

After applying this migration:

1. **Update Environment Variables**: Ensure your `.env` file has the correct Supabase credentials
2. **Test Authentication**: Verify user registration and login work
3. **Test Features**: Create test data and verify all app features work
4. **Monitor Performance**: Check query performance and adjust indexes if needed

## Support

If you encounter issues with this migration:

1. Check the Supabase dashboard for error messages
2. Verify your database permissions
3. Ensure all required extensions are installed
4. Check the application logs for any connection issues

---

**Note**: This migration is designed to be idempotent where possible, but it's recommended to apply it to a fresh database for best results.