-- Fix: infinite recursion in RLS policies for restaurants / restaurant_members
--
-- Root cause: two circular dependencies existed:
--   1. restaurants policy "restaurants_members_select"
--      → queried restaurant_members
--        → "restaurant_members: propriétaire CRUD" queried restaurants
--          → infinite loop
--   2. "restaurant_members: lecture équipe"
--      → self-referential (queried restaurant_members from a policy on restaurant_members)
--
-- Fix: replace direct sub-queries with SECURITY DEFINER helper functions
-- that bypass RLS, breaking all circular dependencies.

-- Drop the 3 recursive/self-recursive policies
DROP POLICY IF EXISTS "restaurants_members_select" ON public.restaurants;
DROP POLICY IF EXISTS "restaurant_members: propriétaire CRUD" ON public.restaurant_members;
DROP POLICY IF EXISTS "restaurant_members: lecture équipe" ON public.restaurant_members;

-- Helper: is the current user an active member of a given restaurant?
CREATE OR REPLACE FUNCTION public.auth_is_restaurant_member(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_id = p_restaurant_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Helper: is the current user the owner of a given restaurant?
CREATE OR REPLACE FUNCTION public.auth_is_restaurant_owner(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id
      AND owner_id = auth.uid()
  );
$$;

-- Recreate: restaurant staff can SELECT their restaurant row (no recursion)
CREATE POLICY "restaurants_members_select" ON public.restaurants
  FOR SELECT
  USING (public.auth_is_restaurant_member(id));

-- Recreate: restaurant owner can do CRUD on restaurant_members (no recursion)
CREATE POLICY "restaurant_members: propriétaire CRUD" ON public.restaurant_members
  FOR ALL
  USING (public.auth_is_restaurant_owner(restaurant_id));

-- Recreate: team members can read fellow members (no self-recursion)
CREATE POLICY "restaurant_members: lecture équipe" ON public.restaurant_members
  FOR SELECT
  USING (public.auth_is_restaurant_member(restaurant_id));
