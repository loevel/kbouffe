-- Track broadcast opens and engagement
CREATE TABLE broadcast_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id UUID NOT NULL REFERENCES admin_broadcasts(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('sent', 'opened', 'clicked')),
    clicked_link TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_broadcast_analytics_broadcast ON broadcast_analytics(broadcast_id, action);
CREATE INDEX idx_broadcast_analytics_restaurant ON broadcast_analytics(restaurant_id, created_at DESC);

-- Update admin_broadcasts with summary stats
ALTER TABLE admin_broadcasts
ADD COLUMN IF NOT EXISTS total_opens INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clicks INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS open_rate DECIMAL(5, 2) DEFAULT 0;

-- Enable RLS
ALTER TABLE broadcast_analytics ENABLE ROW LEVEL SECURITY;

-- Only system can insert (via trusted function)
CREATE POLICY "Only authenticated can view analytics"
    ON broadcast_analytics FOR SELECT
    USING (true);
