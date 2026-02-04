-- Add explicit DENY policy for anonymous/public SELECT operations
CREATE POLICY "Deny public access" 
ON public.user_entitlements 
FOR SELECT 
TO anon 
USING (false);