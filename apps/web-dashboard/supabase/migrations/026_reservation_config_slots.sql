-- Add reservation slot configuration columns to restaurants table.
-- These are read by the public availability API but were missing a migration.

ALTER TABLE IF EXISTS public.restaurants
    ADD COLUMN IF NOT EXISTS reservation_slot_duration  INTEGER DEFAULT 90;

ALTER TABLE IF EXISTS public.restaurants
    ADD COLUMN IF NOT EXISTS reservation_open_time      TEXT    DEFAULT '10:00';

ALTER TABLE IF EXISTS public.restaurants
    ADD COLUMN IF NOT EXISTS reservation_close_time     TEXT    DEFAULT '22:00';

ALTER TABLE IF EXISTS public.restaurants
    ADD COLUMN IF NOT EXISTS reservation_slot_interval  INTEGER DEFAULT 30;
