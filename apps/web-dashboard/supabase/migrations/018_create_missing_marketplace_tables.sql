-- ============================================================
-- TABLE : restaurant_modules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurant_modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    module_id       TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_modules_restaurant_id_idx ON public.restaurant_modules(restaurant_id);
CREATE INDEX IF NOT EXISTS restaurant_modules_module_id_idx ON public.restaurant_modules(module_id);

-- Enable RLS
ALTER TABLE public.restaurant_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_modules: proprietaire CRUD"
    ON public.restaurant_modules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = restaurant_modules.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

-- ============================================================
-- TABLE : payment_transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    amount          INTEGER NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'XAF',
    status          TEXT NOT NULL DEFAULT 'pending',
    payment_method  TEXT,
    reference       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_transactions_order_id_idx ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS payment_transactions_restaurant_id_idx ON public.payment_transactions(restaurant_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_transactions: restaurateur CRUD"
    ON public.payment_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id = payment_transactions.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );
