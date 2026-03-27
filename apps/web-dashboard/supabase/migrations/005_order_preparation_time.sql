ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'orders_preparation_time_minutes_check'
	) THEN
		ALTER TABLE public.orders
		ADD CONSTRAINT orders_preparation_time_minutes_check
		CHECK (preparation_time_minutes IS NULL OR preparation_time_minutes > 0);
	END IF;
END $$;
