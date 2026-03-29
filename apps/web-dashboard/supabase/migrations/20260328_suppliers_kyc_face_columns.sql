-- Migration : Colonnes résultats KYC face liveness
-- Appliquée le 2026-03-28 via Supabase MCP
--
-- Privacy-by-design : on stocke UNIQUEMENT le résultat de la comparaison
-- (score numérique + booléens), jamais les photos CNI ni biométrie brute.

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS kyc_face_verified  boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_face_score     smallint  DEFAULT NULL,  -- 0-100
  ADD COLUMN IF NOT EXISTS kyc_name_match     boolean   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kyc_confidence     text      DEFAULT NULL;  -- 'high'|'medium'|'low'
