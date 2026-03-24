-- ============================================================
-- Migration: 031_delivery_confirmation_code
-- Description: Code de confirmation de livraison (PIN).
--   Généré automatiquement à la création de la commande.
--   Le client le communique au livreur lors de la remise.
-- ============================================================

-- ── Colonne ─────────────────────────────────────────────────
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS delivery_code VARCHAR(6);

-- ── Générateur de code alphanumérique sans ambiguïté ────────
-- Exclut 0/O, 1/I/L pour faciliter la lecture vocale.
CREATE OR REPLACE FUNCTION public.generate_delivery_code()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
AS $$
DECLARE
    chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i      INT;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- ── Trigger : code auto à l'insertion ───────────────────────
CREATE OR REPLACE FUNCTION public.set_order_delivery_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.delivery_code IS NULL THEN
        NEW.delivery_code := public.generate_delivery_code();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_order_delivery_code ON public.orders;
CREATE TRIGGER trg_set_order_delivery_code
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.set_order_delivery_code();

-- ── Back-fill des commandes existantes ──────────────────────
UPDATE public.orders
SET delivery_code = public.generate_delivery_code()
WHERE delivery_code IS NULL;
