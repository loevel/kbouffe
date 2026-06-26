-- Allow active team members (not just the restaurant owner) to read their
-- restaurant's module flags. Without this, the requireModule API middleware
-- (which reads restaurant_modules with the user-scoped JWT client) returned
-- empty for non-owner staff, 403-ing them out of every module-gated route
-- (reservations, marketing, team, payouts, ...).
--
-- restaurant_modules holds only feature flags, so member read access is safe;
-- per-action granularity is still enforced by the API RBAC layer.

CREATE POLICY "restaurant_modules: member read"
ON public.restaurant_modules
FOR SELECT
TO authenticated
USING (
  restaurant_id IN (
    SELECT restaurant_members.restaurant_id
    FROM public.restaurant_members
    WHERE restaurant_members.user_id = auth.uid()
      AND restaurant_members.status = 'active'
  )
);
