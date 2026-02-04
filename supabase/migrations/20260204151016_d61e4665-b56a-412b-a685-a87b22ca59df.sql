-- Prevent any deletion of user entitlements records
-- This protects purchase history and prevents billing disputes
CREATE POLICY "No deletion of entitlements allowed"
ON public.user_entitlements
FOR DELETE
USING (false);