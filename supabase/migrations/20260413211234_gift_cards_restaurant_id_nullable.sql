-- Make restaurant_id nullable for admin gift cards
ALTER TABLE gift_cards
ALTER COLUMN restaurant_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN gift_cards.restaurant_id IS 'Restaurant ID - NULL for admin-issued cards, set for restaurant-issued cards';
