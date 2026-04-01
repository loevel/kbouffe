-- ══════════════════════════════════════════════════════════════════
--  Migration: pos_cash_sessions
--  Suivi de caisse (cash drawer tracking)
--  Useful for SYSCOHADA compliance in Cameroon.
-- ══════════════════════════════════════════════════════════════════

-- Cash sessions (one open session per restaurant at a time)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  operator_member_id  TEXT,                          -- who opened the session (restaurant_members.id)
  opening_amount      INTEGER NOT NULL DEFAULT 0,    -- fond de caisse en FCFA
  closing_amount      INTEGER,                       -- montant compté à la clôture
  expected_amount     INTEGER,                       -- calculé = opening + cash_in - cash_out
  discrepancy         INTEGER,                       -- closing - expected (négatif = manque)
  notes               TEXT,                          -- notes de clôture
  opened_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at           TIMESTAMPTZ,
  CONSTRAINT unique_open_session UNIQUE (restaurant_id, closed_at) DEFERRABLE INITIALLY DEFERRED
);

-- Cash movements within a session
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN ('cash_in', 'cash_out', 'sale', 'refund')),
  amount              INTEGER NOT NULL,              -- toujours positif, le signe vient du type
  order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,  -- si lié à une commande
  operator_member_id  TEXT,
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_restaurant ON public.cash_sessions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_open ON public.cash_sessions(restaurant_id) WHERE closed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_restaurant ON public.cash_movements(restaurant_id);

-- RLS
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- Only service_role can write (API uses service_role)
CREATE POLICY "cash_sessions_service" ON public.cash_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "cash_movements_service" ON public.cash_movements FOR ALL TO service_role USING (true) WITH CHECK (true);
