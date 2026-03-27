-- Track AI feature usage per restaurant
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    feature TEXT NOT NULL CHECK (feature IN ('ai_photo', 'ai_analytics', 'ai_social', 'ai_calendar', 'ai_ocr', 'ai_copywriter')),
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_restaurant_date ON public.ai_usage_logs(restaurant_id, created_at);
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_owner_read" ON public.ai_usage_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE POLICY "ai_usage_insert" ON public.ai_usage_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
