-- ============================================================
--  009_gift_cards.sql — Cartes cadeaux par restaurant
--  Apply: supabase db push  /  supabase migration up
-- ============================================================

-- Cartes cadeaux par restaurant
CREATE TABLE IF NOT EXISTS public.gift_cards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    initial_balance INTEGER NOT NULL CHECK (initial_balance > 0),
    current_balance INTEGER NOT NULL CHECK (current_balance >= 0),
    issued_to       TEXT,           -- nom ou téléphone du bénéficiaire (optionnel)
    note            TEXT,           -- raison/occasion
    expires_at      TIMESTAMPTZ,    -- null = pas d'expiration
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      UUID REFERENCES public.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (restaurant_id, code)    -- code unique par restaurant
);

-- Historique des mouvements
CREATE TABLE IF NOT EXISTS public.gift_card_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_card_id    UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount          INTEGER NOT NULL,               -- positif = rechargement, négatif = déduction
    balance_after   INTEGER NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('issue', 'redeem', 'reload', 'expire')),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter colonnes gift_card sur orders
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS gift_card_id      UUID REFERENCES public.gift_cards(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS gift_card_amount  INTEGER DEFAULT 0;

-- Index
CREATE INDEX IF NOT EXISTS idx_gift_cards_restaurant_id  ON public.gift_cards(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code           ON public.gift_cards(restaurant_id, code);
CREATE INDEX IF NOT EXISTS idx_gift_card_movements_card  ON public.gift_card_movements(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_movements_order ON public.gift_card_movements(order_id);

-- RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_movements ENABLE ROW LEVEL SECURITY;

-- Lecture publique du solde (pour validation au checkout)
CREATE POLICY "gift_cards_public_read" ON public.gift_cards
    FOR SELECT USING (is_active = true);

-- Écriture réservée au service role
CREATE POLICY "gift_cards_service_write" ON public.gift_cards
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "gift_card_movements_service" ON public.gift_card_movements
    FOR ALL USING (auth.role() = 'service_role');
