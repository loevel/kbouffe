-- Add onboarding_completed flag to restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Add cuisine_type column if missing (used during onboarding)
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS cuisine_type TEXT;
