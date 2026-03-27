-- Ensure the enum delivery_type contains 'dine_in'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'delivery_type' AND e.enumlabel = 'dine_in'
    ) THEN
        ALTER TYPE delivery_type ADD VALUE 'dine_in';
    END IF;
END$$;
