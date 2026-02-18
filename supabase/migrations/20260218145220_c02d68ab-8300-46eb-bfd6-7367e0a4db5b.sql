-- Remove public read policy that exposes user_id
DROP POLICY IF EXISTS "Public can read public reviews" ON public.place_reviews;

-- Create a public view excluding user_id and private note
CREATE OR REPLACE VIEW public.place_reviews_public
WITH (security_invoker = false)
AS
SELECT
  id,
  place_name,
  place_id,
  rating,
  content,
  is_public,
  created_at,
  updated_at
FROM public.place_reviews
WHERE is_public = true;

-- Grant read access on the view
GRANT SELECT ON public.place_reviews_public TO anon, authenticated;