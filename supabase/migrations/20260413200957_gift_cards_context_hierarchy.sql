-- Add context hierarchy to gift_cards for proper access control

-- Add issued_by_type to track who created the card (admin or restaurant)
ALTER TABLE gift_cards
ADD COLUMN issued_by_type TEXT NOT NULL DEFAULT 'admin' CHECK (issued_by_type IN ('admin', 'restaurant'));

-- Add issued_by_id to track WHO created the card (admin_id or restaurant_id)
ALTER TABLE gift_cards
ADD COLUMN issued_by_id UUID;

-- Add usable_context to restrict where cards can be used
ALTER TABLE gift_cards
ADD COLUMN usable_context TEXT NOT NULL DEFAULT 'all' CHECK (usable_context IN ('menu_only', 'marketplace_only', 'all'));

-- Add restricted_to_restaurant_id for cards that can only be used in a specific restaurant
ALTER TABLE gift_cards
ADD COLUMN restricted_to_restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- Create index for issued_by queries
CREATE INDEX idx_gift_cards_issued_by ON gift_cards(issued_by_type, issued_by_id);

-- Create index for restricted_to_restaurant queries
CREATE INDEX idx_gift_cards_restricted_to_restaurant ON gift_cards(restricted_to_restaurant_id);

-- Add comment for clarity
COMMENT ON COLUMN gift_cards.issued_by_type IS 'Type of issuer: admin (system admin) or restaurant';
COMMENT ON COLUMN gift_cards.issued_by_id IS 'ID of the issuer (admin_id or restaurant_id)';
COMMENT ON COLUMN gift_cards.usable_context IS 'Context where this card can be used: menu_only, marketplace_only, or all';
COMMENT ON COLUMN gift_cards.restricted_to_restaurant_id IS 'If set, card can only be used by customers of this restaurant';
