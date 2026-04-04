-- Colonnes IA pour reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS ai_moderated     BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_score         SMALLINT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_flags         TEXT[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_moderated_at  TIMESTAMPTZ DEFAULT NULL;

-- Colonnes IA pour support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ai_priority    TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_category    TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_summary     TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_triaged_at  TIMESTAMPTZ DEFAULT NULL;

-- Colonnes score KYC IA pour restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS kyc_ai_score     SMALLINT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kyc_ai_summary   TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kyc_ai_scored_at TIMESTAMPTZ DEFAULT NULL;
