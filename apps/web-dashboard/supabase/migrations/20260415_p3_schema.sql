-- ============================================================
-- P3 Schema: Supplier orders, Promotions, Review responses, Delivery assignments, Fraud scoring
-- ============================================================

-- Supplier purchase orders table
CREATE TABLE IF NOT EXISTS public.supplier_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  total_amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code TEXT UNIQUE,
  type TEXT CHECK (type IN ('percentage', 'fixed', 'free_item')),
  value INTEGER,
  target_segment TEXT,
  target_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Review responses table
CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  response_text TEXT,
  is_auto_response BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Delivery assignments table
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  distance_km NUMERIC(10, 2)
);

-- Order fraud scores table
CREATE TABLE IF NOT EXISTS public.order_fraud_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  flags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE IF EXISTS public.supplier_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_fraud_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Restaurant staff can view supplier orders"
  ON public.supplier_purchase_orders
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Restaurant owners can manage promotions"
  ON public.promotions
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Admin can view fraud scores"
  ON public.order_fraud_scores
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY IF NOT EXISTS "Drivers can view own assignments"
  ON public.delivery_assignments
  FOR SELECT USING (driver_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_po_restaurant ON public.supplier_purchase_orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_supplier_po_created ON public.supplier_purchase_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_active ON public.promotions(restaurant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver ON public.delivery_assignments(driver_id, assigned_at);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_risk_level ON public.order_fraud_scores(risk_level, created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_order ON public.order_fraud_scores(order_id);