
-- Create storage bucket for card illustrations
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-illustrations', 'card-illustrations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Card illustrations are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'card-illustrations');
