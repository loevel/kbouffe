-- Add scheduling to admin_broadcasts
ALTER TABLE admin_broadcasts
ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent'));

-- Create index for scheduled broadcasts processing
CREATE INDEX idx_admin_broadcasts_scheduled ON admin_broadcasts(scheduled_at)
WHERE status = 'scheduled' AND scheduled_at <= NOW();

-- Update existing broadcasts to status='sent'
UPDATE admin_broadcasts SET status = 'sent' WHERE status IS NULL;
