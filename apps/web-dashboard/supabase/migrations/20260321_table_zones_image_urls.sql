-- Add image_urls array column to table_zones (up to 5 photos per zone)
ALTER TABLE public.table_zones ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
