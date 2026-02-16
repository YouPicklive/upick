
-- Create social_shares table
CREATE TABLE public.social_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  post_url text NOT NULL,
  place_id text,
  place_name text,
  lat double precision,
  lng double precision,
  caption text,
  status text NOT NULL DEFAULT 'pending',
  approved_at timestamptz
);

-- Enable RLS
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

-- Users can insert their own rows
CREATE POLICY "Users can insert own social shares"
ON public.social_shares
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Public can read only approved rows
CREATE POLICY "Public can read approved social shares"
ON public.social_shares
FOR SELECT
USING (status = 'approved');

-- Admins can manage all social shares
CREATE POLICY "Admins can manage social shares"
ON public.social_shares
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own pending shares
CREATE POLICY "Users can view own social shares"
ON public.social_shares
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_shares;
