
-- Create storage bucket for bot avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('bot-avatars', 'bot-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Bot avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'bot-avatars');

-- Allow service role to upload
CREATE POLICY "Service role can upload bot avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bot-avatars');
