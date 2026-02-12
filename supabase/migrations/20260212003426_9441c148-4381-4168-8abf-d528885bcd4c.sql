
-- Curated businesses table for spin discovery
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'activity',
  neighborhood TEXT,
  city TEXT DEFAULT 'Richmond',
  state TEXT DEFAULT 'VA',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT,
  price_level TEXT CHECK (price_level IN ('$','$$','$$$','$$$$')),
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  photo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  energy TEXT CHECK (energy IN ('chill','moderate','hype')) DEFAULT 'moderate',
  is_outdoor BOOLEAN DEFAULT false,
  smoking_friendly BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Public read for active businesses
CREATE POLICY "Active businesses are publicly readable"
  ON public.businesses FOR SELECT
  USING (active = true);

-- Admins can manage businesses
CREATE POLICY "Admins can manage businesses"
  ON public.businesses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for location-based queries
CREATE INDEX idx_businesses_location ON public.businesses (latitude, longitude) WHERE active = true;
CREATE INDEX idx_businesses_category ON public.businesses (category) WHERE active = true;
