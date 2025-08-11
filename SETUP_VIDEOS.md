# Video Content Page Setup

This document explains how to set up the Supabase storage bucket and policies required for the video content page to work properly.

## Prerequisites

1. A Supabase project with Storage enabled
2. Environment variables configured in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Step 1: Create the Videos Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Click **New Bucket**
4. Enter bucket name: `videos`
5. Set the bucket to **Public** (this allows public access to files)
6. Click **Create Bucket**

## Step 2: Set Up Storage Policies

If you want to control access to videos, you'll need to set up Row Level Security (RLS) policies. Here are some common policy examples:

### Option A: Public Access (Recommended for public video library)

If you want all videos to be publicly accessible, make sure the bucket is set to **Public** in the dashboard. No additional policies are needed.

### Option B: Authenticated Users Only

If you want only authenticated users to access videos:

1. Go to **Storage** → **Policies** in your Supabase dashboard
2. Click **Add Policy** for the `objects` table
3. Create a policy for **SELECT** operations:

```sql
-- Allow authenticated users to view videos
CREATE POLICY "Allow authenticated users to view videos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'videos');
```

### Option C: Custom Access Control

For more granular control, you can create policies based on user roles or other criteria:

```sql
-- Allow specific users to view videos
CREATE POLICY "Allow specific users to view videos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'videos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.allowed_users
  )
);
```

## Step 3: Upload Sample Videos

To test the content page:

1. Go to **Storage** → **videos** bucket in your Supabase dashboard
2. Click **Upload File**
3. Upload some video files (supported formats: mp4, webm, ogg, mov, avi, mkv)
4. Make sure the files are uploaded successfully

## Step 4: Test the Content Page

1. Navigate to `/content` in your Next.js application
2. The page should load and display all videos from the videos bucket
3. Each video should show:
   - Video preview with controls
   - File name, size, type, and creation date
   - "Open Video" and "Copy URL" buttons

## Troubleshooting

### Common Issues

1. **No videos showing**: 
   - Check if the `videos` bucket exists
   - Verify that video files are uploaded to the bucket
   - Check browser console for errors

2. **Access denied errors**:
   - Ensure proper RLS policies are set up
   - Check if the bucket is set to public (if intended)
   - Verify environment variables are correct

3. **Videos not playing**:
   - Check if the video format is supported by browsers
   - Verify the public URLs are accessible
   - Check CORS settings in Supabase

### Supported Video Formats

The page automatically detects video files based on:
- MIME type starting with `video/`
- File extensions: `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.mkv`

### Performance Considerations

- Videos are loaded with `preload="metadata"` to improve page load times
- The page loads up to 100 videos at once (configurable in the code)
- Videos are sorted by creation date (newest first)

## Security Notes

- If using public buckets, be aware that all files will be publicly accessible
- Consider using signed URLs for private video content
- Implement proper authentication and authorization for sensitive content
- Regular audit of uploaded content is recommended

## Customization

The content page can be customized by modifying `/src/app/content/page.tsx`:

- Change the bucket name in the `supabase.storage.from('videos')` calls
- Modify the video filtering logic
- Customize the UI components and styling
- Add additional metadata or features

## API Reference

The page uses the following Supabase Storage methods:
- `supabase.storage.from('videos').list()` - List files in bucket
- `supabase.storage.from('videos').getPublicUrl()` - Get public URL for files

For more information, see the [Supabase Storage Documentation](https://supabase.com/docs/guides/storage). 