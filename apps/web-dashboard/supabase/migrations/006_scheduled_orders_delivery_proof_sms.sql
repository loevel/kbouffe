-- =====================================================
-- Migration 006: Scheduled Orders + Proof of Delivery + SMS Notifications
-- =====================================================
-- Adds support for:
-- 1. Scheduled orders (customers can order in advance)
-- 2. Proof of delivery (delivery confirmation notes)
-- 3. SMS notification preferences per restaurant

-- ── Scheduled Orders ──────────────────────────────────
-- Allow orders to specify a future date/time for preparation
ALTER TABLE orders
  ADD COLUMN scheduled_for TIMESTAMPTZ DEFAULT NULL;

-- NULL = immediate order (ASAP)
-- Non-null = customer wants delivery/pickup at that time

-- ── Proof of Delivery ─────────────────────────────────
-- Track who delivered and confirmation note
ALTER TABLE orders
  ADD COLUMN delivered_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE orders
  ADD COLUMN delivery_note TEXT DEFAULT NULL;

ALTER TABLE orders
  ADD COLUMN delivered_by TEXT DEFAULT NULL;

-- ── SMS Notification Preferences ──────────────────────
-- Per-restaurant notification channel settings
ALTER TABLE restaurants
  ADD COLUMN sms_notifications_enabled BOOLEAN DEFAULT false;

ALTER TABLE restaurants
  ADD COLUMN notification_channels JSONB DEFAULT '["email", "push"]'::jsonb;

-- notification_channels can contain: "email", "push", "sms", "whatsapp"
