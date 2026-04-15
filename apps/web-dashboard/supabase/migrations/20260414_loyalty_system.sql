-- Loyalty Programs: Configuration per restaurant
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  points_per_fcfa NUMERIC(10, 4) DEFAULT 0.01,
  points_to_reward INTEGER DEFAULT 100,
  reward_value_fcfa INTEGER,
  reward_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(restaurant_id)
);

-- Customer Loyalty: Points balance per customer per restaurant
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, restaurant_id)
);

-- Loyalty Transactions: History of points earn/redeem
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_programs
CREATE POLICY "Restaurant can view/update own loyalty program"
  ON public.loyalty_programs
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view restaurant loyalty programs"
  ON public.loyalty_programs
  FOR SELECT USING (is_active = true);

-- RLS Policies for customer_loyalty
CREATE POLICY "Customers can view own loyalty records"
  ON public.customer_loyalty
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Restaurant staff can view customer loyalty"
  ON public.customer_loyalty
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for loyalty_transactions
CREATE POLICY "Customers can view own transactions"
  ON public.loyalty_transactions
  FOR SELECT USING (
    customer_loyalty_id IN (
      SELECT id FROM public.customer_loyalty
      WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant staff can view transactions"
  ON public.loyalty_transactions
  FOR SELECT USING (
    customer_loyalty_id IN (
      SELECT id FROM public.customer_loyalty
      WHERE restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX idx_loyalty_programs_restaurant_id ON public.loyalty_programs(restaurant_id);
CREATE INDEX idx_customer_loyalty_customer_id ON public.customer_loyalty(customer_id);
CREATE INDEX idx_customer_loyalty_restaurant_id ON public.customer_loyalty(restaurant_id);
CREATE INDEX idx_loyalty_transactions_customer_loyalty_id ON public.loyalty_transactions(customer_loyalty_id);
CREATE INDEX idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at);