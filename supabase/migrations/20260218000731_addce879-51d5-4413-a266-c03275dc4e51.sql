INSERT INTO public.cities (name, state, country, lat, lng, is_popular, timezone)
VALUES ('Charlotte', 'NC', 'US', 35.2271, -80.8431, true, 'America/New_York')
ON CONFLICT DO NOTHING;