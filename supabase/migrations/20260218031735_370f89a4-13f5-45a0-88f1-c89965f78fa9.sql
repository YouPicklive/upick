
-- =============================================
-- SECURE AVATAR STORAGE BUCKET
-- =============================================

-- Drop any existing permissive policies on storage.objects for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

-- Public read access for avatars (needed for profile display)
CREATE POLICY "Anyone can view avatar files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can only upload to their own folder: avatars/{user_id}/*
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar files
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar files
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- FIX OVERLY PERMISSIVE RLS POLICIES
-- =============================================

-- place_photos: Remove redundant "Service role can manage" ALL policy
-- Service role bypasses RLS anyway
DROP POLICY IF EXISTS "Service role can manage place photos" ON public.place_photos;

-- user_entitlements: Remove redundant "Service role can manage entitlements"
DROP POLICY IF EXISTS "Service role can manage entitlements" ON public.user_entitlements;

-- saved_activities: Remove public read - users' saved activities should be private
DROP POLICY IF EXISTS "Public can read saved activities" ON public.saved_activities;

-- saved_spins: Remove dangerous public read policy
DROP POLICY IF EXISTS "Public can read saved spins" ON public.saved_spins;

-- Update avatars bucket to enforce file size limit (2MB) and allowed MIME types
UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';
