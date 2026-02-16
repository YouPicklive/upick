
-- Add bot display name column to feed_posts for bot accounts
ALTER TABLE public.feed_posts ADD COLUMN bot_display_name text;
