-- Migration: Supplier profile enhancements
-- Added 2026-03-29
--
-- Purpose: Add new columns to suppliers table for profile customization:
--   - cover_url: Banner/header image for supplier profile
--   - gallery: Array of photo URLs (max 10)
--   - social_links: JSONB object with social media links
--   - delivery_zones: Array of delivery region names
--   - payment_methods: Array of payment method IDs
--   - delivery_delay_days: Expected delivery time in days
--   - specialties: Array of product specialties/categories
--   - processing_delay_days: Time needed to process orders

ALTER TABLE public.suppliers
ADD COLUMN cover_url TEXT,
ADD COLUMN gallery TEXT[] DEFAULT '{}',
ADD COLUMN social_links JSONB DEFAULT '{}',
ADD COLUMN delivery_zones TEXT[] DEFAULT '{}',
ADD COLUMN payment_methods TEXT[] DEFAULT '{}',
ADD COLUMN delivery_delay_days INTEGER,
ADD COLUMN specialties TEXT[] DEFAULT '{}',
ADD COLUMN processing_delay_days INTEGER;

-- Comments for clarity
COMMENT ON COLUMN suppliers.cover_url IS 'Banner image URL for supplier profile page (1200x340px recommended)';
COMMENT ON COLUMN suppliers.gallery IS 'Array of product/exploitation photos (max 10 images)';
COMMENT ON COLUMN suppliers.social_links IS 'Social media links: {whatsapp, facebook, instagram, website}';
COMMENT ON COLUMN suppliers.delivery_zones IS 'Array of Cameroon regions where supplier delivers';
COMMENT ON COLUMN suppliers.payment_methods IS 'Array of accepted payment method IDs (mtn_money, orange_money, cash, virement, cheque)';
COMMENT ON COLUMN suppliers.delivery_delay_days IS 'Expected number of days for delivery';
COMMENT ON COLUMN suppliers.specialties IS 'Array of product specialties/categories';
COMMENT ON COLUMN suppliers.processing_delay_days IS 'Expected number of days to process an order';
