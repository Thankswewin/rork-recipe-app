# Recipe App

A beautiful React Native recipe sharing app built with Expo.

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to Settings > API
3. Copy your Project URL and anon/public key
4. Create a `.env` file in the root directory (copy from `.env.example`)
5. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** The app includes fallback credentials, so it will work even without a `.env` file, but it's recommended to use your own Supabase project.

### 2. Database Schema

Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor to set up the database:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the schema

This will create:
- `profiles` table for user profiles
- `recipes` table for recipe data
- `favorites` table for user favorites
- Row Level Security policies
- Automatic profile creation trigger

### 3. Authentication Setup

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Enable email confirmations if desired
3. Configure any social providers you want to use

### 4. Running the App

```bash
npm install
npm start
```

## Troubleshooting

### Database Error on Sign Up

If you get "Database error saving new user", try these steps:

1. **Check if the schema is properly set up:**
   - Run the SQL from `supabase-schema.sql` in your Supabase SQL editor
   - Make sure all tables are created successfully

2. **Verify Row Level Security:**
   - The policies should allow users to insert their own profiles
   - Check that the trigger function is created and working

3. **Test the connection:**
   - The app will automatically test the Supabase connection
   - Check the console logs for connection status

4. **Manual profile creation:**
   - The app includes fallback logic to create profiles manually
   - If the trigger fails, it will attempt to create the profile directly

### Environment Variables

The app uses these fallback values if environment variables are not set:
- URL: `https://qczagsahfjpzottzamwk.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Features

- User authentication (sign up, sign in, password reset)
- Recipe browsing and searching
- Favorite recipes
- User profiles
- Dark/light theme toggle
- Beautiful UI with custom components
- Automatic profile creation
- Error handling and fallbacks

## Tech Stack

- React Native with Expo
- Supabase for backend and authentication
- Zustand for state management
- TypeScript
- Lucide React Native for icons