-- Add gift card as a valid order payment method.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'payment_method'
          AND n.nspname = 'public'
    ) THEN
        BEGIN
            ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'gift_card';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
