
-- Cache table for Google Places photo URLs (7-day refresh)
CREATE TABLE public.place_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id TEXT NOT NULL,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint on place_id for upsert
CREATE UNIQUE INDEX idx_place_photos_place_id ON public.place_photos (place_id);

-- Index for cleanup queries
CREATE INDEX idx_place_photos_updated_at ON public.place_photos (updated_at);

-- Enable RLS (public read, service-role write via edge functions)
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached photos
CREATE POLICY "Anyone can read place photos"
  ON public.place_photos
  FOR SELECT
  USING (true);

-- Only service role (edge functions) can insert/update
CREATE POLICY "Service role can manage place photos"
  ON public.place_photos
  FOR ALL
  USING (true)
  WITH CHECK (true);
