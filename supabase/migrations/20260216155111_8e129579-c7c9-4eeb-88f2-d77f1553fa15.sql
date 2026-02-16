
-- Add privacy setting to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_post_privacy text NOT NULL DEFAULT 'public';

-- Create feed_posts table
CREATE TABLE public.feed_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NULL, -- nullable for anonymous/bot posts
  post_type text NOT NULL, -- 'spin_result','review','save','bot'
  title text NOT NULL,
  body text,
  result_place_id text,
  result_name text NOT NULL,
  result_category text,
  result_address text,
  lat double precision,
  lng double precision,
  city text,
  region text,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_bot boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public' -- 'public','private'
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

-- Public can read public feed posts
CREATE POLICY "Public feed posts are readable" ON public.feed_posts
  FOR SELECT USING (visibility = 'public');

-- Authenticated users can insert their own posts
CREATE POLICY "Users can create feed posts" ON public.feed_posts
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Users can delete own posts
CREATE POLICY "Users can delete own feed posts" ON public.feed_posts
  FOR DELETE USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;

-- Create spin_events table
CREATE TABLE public.spin_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  place_id text,
  place_name text NOT NULL,
  category text,
  lat double precision,
  lng double precision,
  city text,
  region text,
  should_post_to_feed boolean NOT NULL DEFAULT true,
  posted_to_feed_at timestamp with time zone,
  caption text
);

ALTER TABLE public.spin_events ENABLE ROW LEVEL SECURITY;

-- Users can insert own spin events
CREATE POLICY "Users can insert own spin events" ON public.spin_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view own spin events
CREATE POLICY "Users can view own spin events" ON public.spin_events
  FOR SELECT USING (user_id = auth.uid());
