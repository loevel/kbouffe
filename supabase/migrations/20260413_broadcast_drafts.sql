-- Create admin_broadcast_drafts table for saving draft broadcasts
CREATE TABLE admin_broadcast_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    template TEXT DEFAULT 'custom',
    target_type TEXT NOT NULL,
    target_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching user's drafts
CREATE INDEX idx_admin_broadcast_drafts_created_by ON admin_broadcast_drafts(created_by, updated_at DESC);

-- Enable RLS
ALTER TABLE admin_broadcast_drafts ENABLE ROW LEVEL SECURITY;

-- Allow admins to read/write their own drafts
CREATE POLICY "Admins can read their own drafts"
    ON admin_broadcast_drafts FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY "Admins can insert their own drafts"
    ON admin_broadcast_drafts FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their own drafts"
    ON admin_broadcast_drafts FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can delete their own drafts"
    ON admin_broadcast_drafts FOR DELETE
    USING (created_by = auth.uid());
