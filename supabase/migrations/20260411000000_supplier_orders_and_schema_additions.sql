-- ============================================================
-- SUPPLIERS MODULE — Add supplier_orders, supplier_order_items
-- and compatibility columns to existing tables
-- ============================================================

-- Add missing columns to supplier_products for mobile app compatibility
ALTER TABLE public.supplier_products
  ADD COLUMN IF NOT EXISTS is_available  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url      TEXT;

-- Create supplier_orders
CREATE TABLE IF NOT EXISTS public.supplier_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id      UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  restaurant_id    UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  total_amount     INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  delivery_address TEXT,
  delivery_date    DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier_id   ON public.supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_restaurant_id ON public.supplier_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status        ON public.supplier_orders(status);

-- Create supplier_order_items
CREATE TABLE IF NOT EXISTS public.supplier_order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES public.supplier_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     NUMERIC NOT NULL,
  unit         TEXT NOT NULL,
  unit_price   INTEGER NOT NULL,
  total_price  INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_order_items_order_id   ON public.supplier_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_product_id ON public.supplier_order_items(product_id);

-- RLS for new tables
ALTER TABLE public.supplier_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_items ENABLE ROW LEVEL SECURITY;

-- supplier_orders: read/write by supplier owner (user_id) or restaurant owner
CREATE POLICY "supplier_orders_select"
  ON public.supplier_orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_orders.supplier_id AND s.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = supplier_orders.restaurant_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "supplier_orders_insert_restaurant"
  ON public.supplier_orders FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = supplier_orders.restaurant_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "supplier_orders_update"
  ON public.supplier_orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_orders.supplier_id AND s.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = supplier_orders.restaurant_id AND r.owner_id = auth.uid())
  );

-- supplier_order_items: read/insert via linked order
CREATE POLICY "supplier_order_items_select"
  ON public.supplier_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier_orders o
      WHERE o.id = supplier_order_items.order_id
        AND (
          EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = o.supplier_id AND s.user_id = auth.uid())
          OR
          EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid())
        )
    )
  );

CREATE POLICY "supplier_order_items_insert"
  ON public.supplier_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.supplier_orders o
      JOIN public.restaurants r ON r.id = o.restaurant_id
      WHERE o.id = supplier_order_items.order_id AND r.owner_id = auth.uid()
    )
  );

-- RLS for existing supplier_products (add if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'supplier_products' AND policyname = 'supplier_products_select_public'
  ) THEN
    ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "supplier_products_select_public"
      ON public.supplier_products FOR SELECT USING (true);

    CREATE POLICY "supplier_products_insert_owner"
      ON public.supplier_products FOR INSERT
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_products.supplier_id AND s.user_id = auth.uid())
      );

    CREATE POLICY "supplier_products_update_owner"
      ON public.supplier_products FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_products.supplier_id AND s.user_id = auth.uid())
      );

    CREATE POLICY "supplier_products_delete_owner"
      ON public.supplier_products FOR DELETE
      USING (
        EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_products.supplier_id AND s.user_id = auth.uid())
      );
  END IF;
END $$;
