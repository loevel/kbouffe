-- Create indexes for analytics performance
-- Composite index on orders for restaurant + date filtering
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON public.orders(restaurant_id, created_at DESC);

-- Index for order_items to order_id relationship (used when joining from orders)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Index on order_items created_at for potential sorting
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at DESC);
