-- ═══════════════════════════════════════════════════════════════════════
-- Setup: Secret interne pour l'auth DB → Edge Functions (via vault)
-- ═══════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'kbouffe_webhook_secret') THEN
    PERFORM vault.create_secret(gen_random_uuid()::text, 'kbouffe_webhook_secret');
  END IF;
END;
$$;

-- Helper SECURITY DEFINER pour lire le secret depuis les triggers
CREATE OR REPLACE FUNCTION public.fn_get_webhook_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'kbouffe_webhook_secret' LIMIT 1;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- FEATURE 4: Trigger INSERT review → modération IA (async via pg_net)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_trigger_review_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://wkuyuiypkbgsftgtstra.supabase.co/functions/v1/auto-moderate-review',
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'x-internal-secret', public.fn_get_webhook_secret()
    ),
    body    := jsonb_build_object(
      'id',            NEW.id,
      'rating',        NEW.rating,
      'comment',       COALESCE(NEW.comment, ''),
      'restaurant_id', NEW.restaurant_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_ai_moderation ON public.reviews;
CREATE TRIGGER trg_review_ai_moderation
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trigger_review_moderation();

-- ═══════════════════════════════════════════════════════════════════════
-- FEATURE 5: Trigger KYC soumis → scoring IA de confiance
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_trigger_kyc_scoring()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kyc_status = 'submitted' AND (OLD.kyc_status IS DISTINCT FROM 'submitted') THEN
    PERFORM net.http_post(
      url     := 'https://wkuyuiypkbgsftgtstra.supabase.co/functions/v1/kyc-confidence-score',
      headers := jsonb_build_object(
        'Content-Type',      'application/json',
        'x-internal-secret', public.fn_get_webhook_secret()
      ),
      body    := jsonb_build_object(
        'restaurant_id', NEW.id,
        'name',          COALESCE(NEW.name, ''),
        'phone',         COALESCE(NEW.phone, ''),
        'address',       COALESCE(NEW.address, ''),
        'city',          COALESCE(NEW.city, ''),
        'email',         COALESCE(NEW.email, ''),
        'kyc_niu',       COALESCE(NEW.kyc_niu, ''),
        'kyc_rccm',      COALESCE(NEW.kyc_rccm, ''),
        'has_niu_doc',   (NEW.kyc_niu_url IS NOT NULL AND NEW.kyc_niu_url != ''),
        'has_rccm_doc',  (NEW.kyc_rccm_url IS NOT NULL AND NEW.kyc_rccm_url != ''),
        'has_id_doc',    (NEW.kyc_id_url IS NOT NULL AND NEW.kyc_id_url != ''),
        'has_logo',      (NEW.logo_url IS NOT NULL AND NEW.logo_url != ''),
        'rccm',          COALESCE(NEW.rccm, ''),
        'nif',           COALESCE(NEW.nif, ''),
        'kyc_notes',     COALESCE(NEW.kyc_notes, '')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kyc_ai_scoring ON public.restaurants;
CREATE TRIGGER trg_kyc_ai_scoring
  AFTER UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trigger_kyc_scoring();

-- ═══════════════════════════════════════════════════════════════════════
-- FEATURE 6: Trigger INSERT ticket → triage IA automatique
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_trigger_ticket_triage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://wkuyuiypkbgsftgtstra.supabase.co/functions/v1/auto-triage-ticket',
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'x-internal-secret', public.fn_get_webhook_secret()
    ),
    body    := jsonb_build_object(
      'id',          NEW.id,
      'subject',     COALESCE(NEW.subject, ''),
      'description', COALESCE(NEW.description, ''),
      'priority',    COALESCE(NEW.priority, 'medium'),
      'type',        COALESCE(NEW.reporter_type, 'client')
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_ai_triage ON public.support_tickets;
CREATE TRIGGER trg_ticket_ai_triage
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trigger_ticket_triage();

-- ═══════════════════════════════════════════════════════════════════════
-- FEATURE 2: pg_cron — rappels onboarding 48h et 7 jours (via Edge Fn)
-- ═══════════════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'auto-onboarding-reminders-48h',
  '0 9 * * *',
  $$SELECT net.http_post(
    url     := 'https://wkuyuiypkbgsftgtstra.supabase.co/functions/v1/auto-onboarding-remind',
    headers := jsonb_build_object('Content-Type','application/json','x-internal-secret',public.fn_get_webhook_secret()),
    body    := '{"delay_hours":48}'::jsonb
  )$$
) WHERE NOT EXISTS (SELECT FROM cron.job WHERE jobname = 'auto-onboarding-reminders-48h');

SELECT cron.schedule(
  'auto-onboarding-reminders-7d',
  '30 9 * * *',
  $$SELECT net.http_post(
    url     := 'https://wkuyuiypkbgsftgtstra.supabase.co/functions/v1/auto-onboarding-remind',
    headers := jsonb_build_object('Content-Type','application/json','x-internal-secret',public.fn_get_webhook_secret()),
    body    := '{"delay_hours":168}'::jsonb
  )$$
) WHERE NOT EXISTS (SELECT FROM cron.job WHERE jobname = 'auto-onboarding-reminders-7d');
