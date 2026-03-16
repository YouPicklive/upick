-- Clear stale cached photos that contain direct Google API URLs
-- These will be re-fetched through the proxy on next access
DELETE FROM public.place_photos;

-- Clear business photo_urls that contain direct Google API key references
UPDATE public.businesses
SET photo_url = NULL
WHERE photo_url LIKE '%maps.googleapis.com%key=%';