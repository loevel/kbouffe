-- Create marketing_campaigns table for admin campaign management
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('sms', 'push', 'banner', 'email')),
    target_audience VARCHAR(50) NOT NULL CHECK (target_audience IN ('all', 'customers', 'inactive', 'new')),
    budget BIGINT NOT NULL DEFAULT 0,
    spend BIGINT NOT NULL DEFAULT 0,
    reach BIGINT NOT NULL DEFAULT 0,
    impressions BIGINT NOT NULL DEFAULT 0,
    clicks BIGINT NOT NULL DEFAULT 0,
    ctr NUMERIC NOT NULL DEFAULT 0,
    conversions BIGINT NOT NULL DEFAULT 0,
    content TEXT,
    cta_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'ended')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_marketing_campaigns_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_restaurant_id ON public.marketing_campaigns(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON public.marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at ON public.marketing_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_starts_at ON public.marketing_campaigns(starts_at);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_ends_at ON public.marketing_campaigns(ends_at);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow admins full access
CREATE POLICY "Admins can view all campaigns" ON public.marketing_campaigns
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND admin_role IS NOT NULL
        )
    );

-- Allow admins to insert campaigns
CREATE POLICY "Admins can create campaigns" ON public.marketing_campaigns
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND admin_role IS NOT NULL
        )
    );

-- Allow admins to update campaigns
CREATE POLICY "Admins can update campaigns" ON public.marketing_campaigns
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND admin_role IS NOT NULL
        )
    );

-- Allow admins to delete campaigns
CREATE POLICY "Admins can delete campaigns" ON public.marketing_campaigns
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND admin_role IS NOT NULL
        )
    );
