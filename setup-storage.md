# Supabase Storage Setup

The "Bucket not found" error occurs because the storage buckets haven't been created yet. Here's how to fix it:

## Option 1: Manual Setup (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click **Create bucket**
5. Create two buckets:

### Avatars Bucket
- **Name**: `avatars`
- **Public**: ✅ Yes (checked)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`

### Recipe Images Bucket  
- **Name**: `recipe-images`
- **Public**: ✅ Yes (checked)
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg,image/png,image/webp`

## Option 2: SQL Setup

Run the updated `supabase-schema.sql` file which now includes the storage bucket creation commands.

## Verify Setup

After creating the buckets, try uploading an avatar again. The error should be resolved.

## Storage Policies

The SQL schema includes proper RLS policies that ensure:
- Users can only upload/modify their own files
- All images are publicly readable
- Files are organized by user ID for better organization

## Troubleshooting

If you still get errors:
1. Check that the buckets exist in your Supabase dashboard
2. Verify the bucket names match exactly: `avatars` and `recipe-images`
3. Ensure the buckets are set to public
4. Check that your Supabase project has storage enabled