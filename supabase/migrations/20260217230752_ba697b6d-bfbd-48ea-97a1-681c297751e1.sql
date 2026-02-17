-- Fix: Remove overly permissive public read policy on saved_spins
DROP POLICY IF EXISTS "Public can read saved spins" ON public.saved_spins;