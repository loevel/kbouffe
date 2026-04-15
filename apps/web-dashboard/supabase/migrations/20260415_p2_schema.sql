-- ============================================================
-- P2 Schema: Email queue, Payout calculations, Customer segments
-- ============================================================

-- Email sends enhancement
ALTER TABLE IF EXISTS public.email_sends
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS email_type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Customer segments table for RFM analysis
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  segment TEXT NOT NULL CHECK (segment IN ('vip', 'loyal', 'dormant', 'new', 'at_risk')),
  order_count INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  days_since_order INTEGER,
  avg_order_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, restaurant_id)
);

-- Payout calculations table for tracking weekly payouts
CREATE TABLE IF NOT EXISTS public.payout_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL,
  orders_count INTEGER,
  gross_revenue INTEGER,
  platform_fee INTEGER,
  net_amount INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(restaurant_id, calculation_date)
);

-- Enable RLS
ALTER TABLE IF EXISTS public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payout_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_segments
CREATE POLICY IF NOT EXISTS "Restaurant staff can view customer segments"
  ON public.customer_segments
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Customers can view own segment"
  ON public.customer_segments
  FOR SELECT USING (customer_id = auth.uid());

-- RLS Policies for payout_calculations
CREATE POLICY IF NOT EXISTS "Restaurant owners can view own payouts"
  ON public.payout_calculations
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_segments_restaurant ON public.customer_segments(restaurant_id, segment);
CREATE INDEX IF NOT EXISTS idx_customer_segments_last_order ON public.customer_segments(last_order_date);
CREATE INDEX IF NOT EXISTS idx_customer_segments_days_since ON public.customer_segments(days_since_order);
CREATE INDEX IF NOT EXISTS idx_payout_calculations_restaurant ON public.payout_calculations(restaurant_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON public.email_sends(status, created_at);