
-- ============================================
-- 1. Create cities table
-- ============================================
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint on name+state
ALTER TABLE public.cities ADD CONSTRAINT cities_name_state_unique UNIQUE (name, state);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Cities are publicly readable
CREATE POLICY "Cities are publicly readable"
  ON public.cities FOR SELECT
  USING (true);

-- Admins can manage cities
CREATE POLICY "Admins can manage cities"
  ON public.cities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. Add city_id to feed_posts
-- ============================================
ALTER TABLE public.feed_posts
  ADD COLUMN city_id UUID REFERENCES public.cities(id),
  ADD COLUMN post_subtype TEXT,
  ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Index for city-based feed queries
CREATE INDEX idx_feed_posts_city_id ON public.feed_posts(city_id);
CREATE INDEX idx_feed_posts_city_created ON public.feed_posts(city_id, created_at DESC);
CREATE INDEX idx_feed_posts_expires ON public.feed_posts(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- 3. Add selected_city_id to profiles
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN selected_city_id UUID REFERENCES public.cities(id);

-- ============================================
-- 4. Seed popular cities
-- ============================================
INSERT INTO public.cities (name, state, country, lat, lng, is_popular, timezone) VALUES
  ('Richmond', 'VA', 'US', 37.5407, -77.4360, true, 'America/New_York'),
  ('Norfolk', 'VA', 'US', 36.8508, -76.2859, true, 'America/New_York'),
  ('Washington', 'DC', 'US', 38.9072, -77.0369, true, 'America/New_York'),
  ('New York', 'NY', 'US', 40.7128, -74.0060, true, 'America/New_York'),
  ('Austin', 'TX', 'US', 30.2672, -97.7431, true, 'America/Chicago'),
  ('Virginia Beach', 'VA', 'US', 36.8529, -75.9780, true, 'America/New_York'),
  ('Charlottesville', 'VA', 'US', 38.0293, -78.4767, true, 'America/New_York')
ON CONFLICT (name, state) DO NOTHING;

-- ============================================
-- 5. Backfill existing feed_posts with city_id
-- ============================================
UPDATE public.feed_posts fp
SET city_id = c.id
FROM public.cities c
WHERE fp.city = c.name AND fp.city_id IS NULL;
