-- ============================================================
-- Migration : Marketplace KBouffe
-- Permet aux restaurants d'acheter des packs sponsorisation/publicité/SMS/etc
-- Date : 2026-03-19
-- ============================================================

-- ============================================================
-- ENUMs
-- ============================================================

CREATE TYPE marketplace_pack_type AS ENUM (
  'visibility',        -- Sponsorisation / remontée dans les listings
  'advertising',       -- Budget publicitaire + push notifications
  'boost_menu',        -- Produits mis en avant sur la homepage client
  'sms_blast',         -- Envoi SMS en masse aux clients fidèles
  'premium_analytics', -- Tableaux de bord avancés (CRM+)
  'priority_support',  -- Support prioritaire dédié
  'featured_banner',   -- Bannière sur la page d'accueil client
  'extra_storage'      -- Quota R2 élargi pour photos/vidéos
);

CREATE TYPE subscription_status AS ENUM (
  'pending_payment', -- En attente de confirmation paiement
  'active',          -- Pack actif
  'expired',         -- Pack expiré (durée écoulée)
  'cancelled',       -- Annulé manuellement (admin ou merchant)
  'refunded'         -- Remboursé
);

-- ============================================================
-- TABLE : marketplace_packs (catalogue admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_packs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              TEXT NOT NULL,
    slug              TEXT NOT NULL UNIQUE,
    description       TEXT,
    type              marketplace_pack_type NOT NULL,
    price             INTEGER NOT NULL,
    duration_days     INTEGER NOT NULL DEFAULT 30,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    is_featured       BOOLEAN NOT NULL DEFAULT false,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    features          JSONB NOT NULL DEFAULT '[]',
    limits            JSONB NOT NULL DEFAULT '{}',
    badge_color       TEXT,
    image_url         TEXT,
    created_by        UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_packs_type ON public.marketplace_packs(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_packs_active ON public.marketplace_packs(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_marketplace_packs_slug ON public.marketplace_packs(slug);

-- ============================================================
-- TABLE : restaurant_pack_subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurant_pack_subscriptions (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id             UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    pack_id                   UUID NOT NULL REFERENCES public.marketplace_packs(id) ON DELETE RESTRICT,
    status                    subscription_status NOT NULL DEFAULT 'pending_payment',
    price_paid                INTEGER NOT NULL,
    currency                  TEXT NOT NULL DEFAULT 'XAF',
    starts_at                 TIMESTAMPTZ,
    expires_at                TIMESTAMPTZ,
    auto_renew                BOOLEAN NOT NULL DEFAULT false,
    payment_transaction_id    UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    activated_at              TIMESTAMPTZ,
    cancelled_at              TIMESTAMPTZ,
    cancellation_reason       TEXT,
    metadata                  JSONB,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON public.restaurant_pack_subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_pack ON public.restaurant_pack_subscriptions(pack_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.restaurant_pack_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.restaurant_pack_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.restaurant_pack_subscriptions(restaurant_id, status, expires_at)
  WHERE status = 'active';

-- ============================================================
-- Extend payment_transactions & ledger_entries
-- ============================================================

ALTER TABLE public.payment_transactions 
  ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'order'
  CHECK (context IN ('order', 'marketplace'));

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS marketplace_subscription_id UUID 
  REFERENCES public.restaurant_pack_subscriptions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription ON public.payment_transactions(marketplace_subscription_id)
  WHERE marketplace_subscription_id IS NOT NULL;

-- Update ledger_entries check constraint to include marketplace
ALTER TABLE public.ledger_entries 
  DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;

ALTER TABLE public.ledger_entries 
  ADD CONSTRAINT ledger_entries_entry_type_check 
  CHECK (entry_type IN (
    'cash_in', 'platform_fee', 'psp_fee', 'restaurant_liability', 
    'payout', 'refund',
    'marketplace_purchase', 'marketplace_refund'
  ));

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE TRIGGER update_marketplace_packs_updated_at
  BEFORE UPDATE ON public.marketplace_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.restaurant_pack_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- 1. marketplace_initiate_purchase
CREATE OR REPLACE FUNCTION public.marketplace_initiate_purchase(
  p_restaurant_id   UUID,
  p_pack_id         UUID,
  p_payer_msisdn    TEXT
)
RETURNS TABLE(subscription_id UUID, transaction_id UUID, reference_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pack          marketplace_packs%ROWTYPE;
  v_sub_id        UUID := uuid_generate_v4();
  v_tx_id         UUID := uuid_generate_v4();
  v_ref_id        UUID := uuid_generate_v4();
BEGIN
  SELECT * INTO v_pack FROM public.marketplace_packs 
  WHERE id = p_pack_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pack introuvable ou inactif';
  END IF;

  INSERT INTO public.restaurant_pack_subscriptions 
    (id, restaurant_id, pack_id, status, price_paid)
  VALUES 
    (v_sub_id, p_restaurant_id, p_pack_id, 'pending_payment', v_pack.price);

  INSERT INTO public.payment_transactions 
    (id, restaurant_id, provider, reference_id, payer_msisdn, amount, currency, 
     status, context, marketplace_subscription_id)
  VALUES 
    (v_tx_id, p_restaurant_id, 'mtn_momo', v_ref_id, p_payer_msisdn, 
     v_pack.price, 'XAF', 'pending', 'marketplace', v_sub_id);

  RETURN QUERY SELECT v_sub_id, v_tx_id, v_ref_id;
END;
$$;

-- 2. marketplace_apply_pack_benefits
CREATE OR REPLACE FUNCTION public.marketplace_apply_pack_benefits(
  p_restaurant_id   UUID,
  p_pack_id         UUID,
  p_subscription_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pack      marketplace_packs%ROWTYPE;
  v_sub       restaurant_pack_subscriptions%ROWTYPE;
  v_ranking   INTEGER;
BEGIN
  SELECT * INTO v_pack FROM public.marketplace_packs WHERE id = p_pack_id;
  SELECT * INTO v_sub FROM public.restaurant_pack_subscriptions WHERE id = p_subscription_id;

  IF v_pack.type IN ('visibility', 'advertising', 'featured_banner') THEN
    SELECT COALESCE(MAX(sponsored_rank), 0) + 1 INTO v_ranking FROM public.restaurants 
    WHERE is_sponsored > 0;

    UPDATE public.restaurants SET
      is_sponsored = 1,
      sponsored_until = EXTRACT(EPOCH FROM v_sub.expires_at)::BIGINT,
      sponsored_rank = v_ranking,
      updated_at = now()
    WHERE id = p_restaurant_id;
  END IF;
END;
$$;

-- 3. marketplace_revoke_pack_benefits
CREATE OR REPLACE FUNCTION public.marketplace_revoke_pack_benefits(
  p_restaurant_id UUID,
  p_pack_id       UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pack          marketplace_packs%ROWTYPE;
  v_still_active  BOOLEAN;
BEGIN
  SELECT * INTO v_pack FROM public.marketplace_packs WHERE id = p_pack_id;

  IF v_pack.type IN ('visibility', 'advertising', 'featured_banner') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.restaurant_pack_subscriptions rps
      JOIN public.marketplace_packs mp ON mp.id = rps.pack_id
      WHERE rps.restaurant_id = p_restaurant_id
        AND rps.status = 'active'
        AND mp.type = v_pack.type
        AND rps.pack_id != p_pack_id
    ) INTO v_still_active;

    IF NOT v_still_active THEN
      UPDATE public.restaurants SET
        is_sponsored = 0,
        sponsored_until = NULL,
        sponsored_rank = 0,
        updated_at = now()
      WHERE id = p_restaurant_id;
    END IF;
  END IF;
END;
$$;

-- 4. marketplace_confirm_payment
CREATE OR REPLACE FUNCTION public.marketplace_confirm_payment(
  p_reference_id  UUID,
  p_external_id   TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tx            payment_transactions%ROWTYPE;
  v_sub           restaurant_pack_subscriptions%ROWTYPE;
  v_pack          marketplace_packs%ROWTYPE;
  v_starts_at     TIMESTAMPTZ := now();
  v_expires_at    TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_tx FROM public.payment_transactions 
  WHERE reference_id = p_reference_id AND context = 'marketplace';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction introuvable (ref: %)', p_reference_id;
  END IF;
  IF v_tx.status != 'pending' THEN
    RAISE EXCEPTION 'Transaction déjà traitée (status: %)', v_tx.status;
  END IF;

  SELECT * INTO v_sub FROM public.restaurant_pack_subscriptions 
  WHERE id = v_tx.marketplace_subscription_id;
  SELECT * INTO v_pack FROM public.marketplace_packs WHERE id = v_sub.pack_id;

  v_expires_at := v_starts_at + (v_pack.duration_days || ' days')::interval;

  UPDATE public.payment_transactions SET
    status = 'paid',
    external_id = p_external_id,
    completed_at = now(),
    updated_at = now()
  WHERE id = v_tx.id;

  UPDATE public.restaurant_pack_subscriptions SET
    status = 'active',
    starts_at = v_starts_at,
    expires_at = v_expires_at,
    activated_at = now(),
    payment_transaction_id = v_tx.id,
    updated_at = now()
  WHERE id = v_sub.id;

  INSERT INTO public.ledger_entries 
    (restaurant_id, payment_transaction_id, entry_type, direction, amount, currency, description, metadata)
  VALUES (
    v_sub.restaurant_id, v_tx.id, 'marketplace_purchase', 'debit', v_tx.amount, 'XAF',
    'Achat pack Marketplace : ' || v_pack.name,
    jsonb_build_object('pack_id', v_pack.id, 'pack_type', v_pack.type, 'subscription_id', v_sub.id)
  );

  PERFORM public.marketplace_apply_pack_benefits(v_sub.restaurant_id, v_pack.id, v_sub.id);
END;
$$;

-- 5. marketplace_expire_packs
CREATE OR REPLACE FUNCTION public.marketplace_expire_packs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count     INTEGER := 0;
  v_sub       restaurant_pack_subscriptions%ROWTYPE;
BEGIN
  FOR v_sub IN
    SELECT * FROM public.restaurant_pack_subscriptions
    WHERE status = 'active' AND expires_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.restaurant_pack_subscriptions SET
      status = 'expired',
      updated_at = now()
    WHERE id = v_sub.id;

    PERFORM public.marketplace_revoke_pack_benefits(v_sub.restaurant_id, v_sub.pack_id);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 6. get_active_packs_for_restaurant
CREATE OR REPLACE FUNCTION public.get_active_packs_for_restaurant(p_restaurant_id UUID)
RETURNS TABLE(
  subscription_id   UUID,
  pack_id           UUID,
  pack_name         TEXT,
  pack_type         marketplace_pack_type,
  features          JSONB,
  limits            JSONB,
  expires_at        TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    rps.id, mp.id, mp.name, mp.type, mp.features, mp.limits, rps.expires_at
  FROM public.restaurant_pack_subscriptions rps
  JOIN public.marketplace_packs mp ON mp.id = rps.pack_id
  WHERE rps.restaurant_id = p_restaurant_id
    AND rps.status = 'active'
    AND rps.expires_at > now()
  ORDER BY rps.expires_at DESC;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.marketplace_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_pack_subscriptions ENABLE ROW LEVEL SECURITY;

-- marketplace_packs
CREATE POLICY "marketplace_packs: lecture publique active"
  ON public.marketplace_packs FOR SELECT
  USING (is_active = true);

CREATE POLICY "marketplace_packs: admin CRUD"
  ON public.marketplace_packs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- restaurant_pack_subscriptions
CREATE POLICY "subscriptions: owner lecture"
  ON public.restaurant_pack_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.restaurants r 
    WHERE r.id = restaurant_pack_subscriptions.restaurant_id 
    AND r.owner_id = (SELECT auth.uid())));

CREATE POLICY "subscriptions: owner insert"
  ON public.restaurant_pack_subscriptions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r 
    WHERE r.id = restaurant_pack_subscriptions.restaurant_id 
    AND r.owner_id = (SELECT auth.uid())));

CREATE POLICY "subscriptions: admin CRUD"
  ON public.restaurant_pack_subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- ============================================================
-- CRON JOBS (via pg_cron)
-- ============================================================

-- Expirer les packs toutes les heures
SELECT cron.schedule(
  'marketplace-expire-packs',
  '0 * * * *',
  $$ SELECT public.marketplace_expire_packs(); $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule;

-- Nettoyage quotidien des transactions pending_payment >48h
SELECT cron.schedule(
  'marketplace-cleanup-abandoned',
  '0 3 * * *',
  $$
    UPDATE public.restaurant_pack_subscriptions SET status = 'cancelled'
    WHERE status = 'pending_payment'
      AND created_at < now() - interval '48 hours';

    UPDATE public.payment_transactions SET status = 'failed'
    WHERE context = 'marketplace'
      AND status = 'pending'
      AND created_at < now() - interval '48 hours';
  $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule;

-- ============================================================
-- SEED DATA (Packs initiaux)
-- ============================================================

INSERT INTO public.marketplace_packs 
  (slug, name, type, price, duration_days, description, features, is_active, sort_order)
VALUES 
  ('visibility-starter', 'Pack Visibilité Starter', 'visibility', 5000, 7, 
   'Sponsorisation 7 jours', 
   '[{"key":"visibility","label":"Remontée dans listings","value":"7 jours"}]'::jsonb,
   true, 10),
  
  ('visibility-pro', 'Pack Visibilité Pro', 'visibility', 15000, 30,
   'Sponsorisation mensuelle premium',
   '[{"key":"visibility","label":"Remontée prioritaire","value":"30 jours"},{"key":"featured","label":"Badge spécial","value":"Oui"}]'::jsonb,
   true, 9),
  
  ('visibility-premium', 'Pack Visibilité Premium', 'visibility', 25000, 30,
   'Maximum de visibilité',
   '[{"key":"visibility","label":"Top position","value":"30 jours"},{"key":"featured","label":"Badge premium","value":"Oui"},{"key":"home","label":"Page d''accueil","value":"Oui"}]'::jsonb,
   true, 8),
  
  ('ads-starter', 'Pack Pub Starter', 'advertising', 10000, 30,
   'Budget publicitaire 30 jours',
   '[{"key":"budget","label":"Budget ads","value":"10,000 FCFA"},{"key":"push","label":"Push notifications","value":"Jusqu''à 1000"}]'::jsonb,
   true, 7),
  
  ('ads-pro', 'Pack Pub Pro', 'advertising', 30000, 30,
   'Budget publicitaire premium',
   '[{"key":"budget","label":"Budget ads","value":"30,000 FCFA"},{"key":"push","label":"Push notifications","value":"Illimitées"},{"key":"sms","label":"SMS bonus","value":"50 SMS"}]'::jsonb,
   true, 6),
  
  ('sms-blast-100', 'SMS Blast 100', 'sms_blast', 3000, 30,
   '100 SMS branding à vos clients',
   '[{"key":"sms","label":"SMS à envoyer","value":"100"}]'::jsonb,
   true, 5),
  
  ('sms-blast-500', 'SMS Blast 500', 'sms_blast', 10000, 30,
   '500 SMS branding',
   '[{"key":"sms","label":"SMS à envoyer","value":"500"}]'::jsonb,
   true, 4),
  
  ('featured-banner', 'Bannière Accueil', 'featured_banner', 20000, 30,
   'Bannière sur page d''accueil client',
   '[{"key":"banner","label":"Bannière visible","value":"30 jours"}]'::jsonb,
   true, 3),
  
  ('boost-menu', 'Boost Menu (3 produits)', 'boost_menu', 8000, 14,
   'Mettez 3 produits en avant',
   '[{"key":"products","label":"Produits en avant","value":"3"}]'::jsonb,
   true, 2),
  
  ('analytics-pro', 'Analytics Pro', 'premium_analytics', 12000, 30,
   'Suite d''analytics avancés',
   '[{"key":"analytics","label":"Tableaux avancés","value":"Oui"},{"key":"reports","label":"Rapports PDF","value":"Oui"},{"key":"trends","label":"Tendances clients","value":"Oui"}]'::jsonb,
   true, 1);
