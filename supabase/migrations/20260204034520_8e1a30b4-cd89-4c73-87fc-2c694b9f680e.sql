-- Create fortune tier enum
CREATE TYPE public.fortune_tier AS ENUM ('free', 'plus', 'pack');

-- Create fortunes table
CREATE TABLE public.fortunes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier fortune_tier NOT NULL DEFAULT 'free',
  pack_key TEXT, -- null for free/plus, else: love, career, unhinged, main_character
  text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint: pack_key must be null for free/plus tiers, required for pack tier
  CONSTRAINT valid_pack_key CHECK (
    (tier = 'pack' AND pack_key IS NOT NULL) OR
    (tier != 'pack' AND pack_key IS NULL)
  )
);

-- Create user_entitlements table
CREATE TABLE public.user_entitlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plus_active BOOLEAN NOT NULL DEFAULT false,
  owned_packs TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_entitlement UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.fortunes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- Fortunes are readable by everyone (we filter by tier in app logic)
CREATE POLICY "Fortunes are publicly readable"
  ON public.fortunes
  FOR SELECT
  USING (active = true);

-- User entitlements: users can only see their own
CREATE POLICY "Users can view their own entitlements"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own entitlements (for first-time setup)
CREATE POLICY "Users can create their own entitlements"
  ON public.user_entitlements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entitlements
CREATE POLICY "Users can update their own entitlements"
  ON public.user_entitlements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for user_entitlements
CREATE TRIGGER update_user_entitlements_updated_at
  BEFORE UPDATE ON public.user_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster fortune lookups
CREATE INDEX idx_fortunes_tier ON public.fortunes(tier);
CREATE INDEX idx_fortunes_pack_key ON public.fortunes(pack_key) WHERE pack_key IS NOT NULL;
CREATE INDEX idx_user_entitlements_user_id ON public.user_entitlements(user_id);