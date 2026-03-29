-- ============================================================
-- Migration: supplier_order_traces + supplier_messages
-- Appliquée le 2026-03-29 via Supabase MCP
--
-- Permet aux restaurants d'enregistrer les achats agricoles
-- et d'envoyer des messages/devis aux fournisseurs
-- ============================================================

-- ── 1. TABLE: supplier_order_traces ──────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_order_traces (
    id                      uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id           uuid            NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    supplier_id             uuid            NOT NULL REFERENCES public.suppliers(id)   ON DELETE RESTRICT,
    product_id              uuid            NOT NULL REFERENCES public.supplier_products(id) ON DELETE RESTRICT,
    quantity                numeric(12, 3)  NOT NULL CHECK (quantity > 0),
    unit                    varchar(50)     NOT NULL,
    unit_price              numeric(14, 2)  NOT NULL CHECK (unit_price >= 0),
    total_price             numeric(14, 2)  NOT NULL CHECK (total_price >= 0),
    platform_fee            numeric(14, 2)  NOT NULL DEFAULT 0,
    lot_number              varchar(100),
    harvest_date            date,
    expected_delivery_date  date,
    actual_delivery_date    date,
    delivery_status         varchar(20)     NOT NULL DEFAULT 'pending'
                            CHECK (delivery_status IN ('pending','confirmed','delivered','disputed','cancelled')),
    notes                   text,
    created_at              timestamptz     NOT NULL DEFAULT now(),
    updated_at              timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sot_supplier_id   ON public.supplier_order_traces (supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sot_restaurant_id ON public.supplier_order_traces (restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sot_status        ON public.supplier_order_traces (delivery_status);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_sot_updated_at ON public.supplier_order_traces;
CREATE TRIGGER trg_sot_updated_at
    BEFORE UPDATE ON public.supplier_order_traces
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.supplier_order_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sot_restaurant_select" ON public.supplier_order_traces
    FOR SELECT TO authenticated
    USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "sot_restaurant_insert" ON public.supplier_order_traces
    FOR INSERT TO authenticated
    WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "sot_supplier_select" ON public.supplier_order_traces
    FOR SELECT TO authenticated
    USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "sot_supplier_update" ON public.supplier_order_traces
    FOR UPDATE TO authenticated
    USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()))
    WITH CHECK (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

-- ── 2. TABLE: supplier_messages ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_messages (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id   uuid        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    supplier_id     uuid        NOT NULL REFERENCES public.suppliers(id)   ON DELETE CASCADE,
    product_id      uuid        REFERENCES public.supplier_products(id)    ON DELETE SET NULL,
    message_type    varchar(20) NOT NULL DEFAULT 'rfq'
                    CHECK (message_type IN ('rfq', 'inquiry', 'order_note', 'complaint')),
    subject         varchar(200),
    body            text        NOT NULL,
    quantity        numeric(12, 3),
    unit            varchar(50),
    requested_date  date,
    status          varchar(20) NOT NULL DEFAULT 'unread'
                    CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    replied_at      timestamptz,
    reply_body      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sm_supplier_id   ON public.supplier_messages (supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sm_restaurant_id ON public.supplier_messages (restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sm_status        ON public.supplier_messages (status);

DROP TRIGGER IF EXISTS trg_sm_updated_at ON public.supplier_messages;
CREATE TRIGGER trg_sm_updated_at
    BEFORE UPDATE ON public.supplier_messages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.supplier_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sm_restaurant_all" ON public.supplier_messages
    FOR ALL TO authenticated
    USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
    WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "sm_supplier_select_update" ON public.supplier_messages
    FOR ALL TO authenticated
    USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()))
    WITH CHECK (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

COMMENT ON TABLE public.supplier_order_traces IS 'Traçabilité des achats agricoles restaurant→fournisseur (Art.18 Loi 2015/018)';
COMMENT ON TABLE public.supplier_messages     IS 'Messages et demandes de devis (RFQ) des restaurants vers les fournisseurs';
