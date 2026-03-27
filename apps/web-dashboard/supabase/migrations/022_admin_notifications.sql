-- admin_notifications: alertes pour les admins plateforme
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type        TEXT NOT NULL, -- 'new_restaurant', 'kyc_submitted', 'support_ticket', 'new_order'
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_notifications_is_read_idx ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS admin_notifications_created_at_idx ON public.admin_notifications(created_at DESC);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read/update admin notifications
CREATE POLICY "admin_notifications: admin all"
    ON public.admin_notifications FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Trigger: new restaurant created
CREATE OR REPLACE FUNCTION public.notify_admin_new_restaurant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.admin_notifications (type, title, body, payload)
    VALUES (
        'new_restaurant',
        'Nouveau restaurant inscrit',
        COALESCE(NEW.name, 'Nouveau restaurant') || ' vient de s''inscrire sur la plateforme.',
        jsonb_build_object('restaurant_id', NEW.id, 'restaurant_name', NEW.name, 'slug', NEW.slug)
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_new_restaurant ON public.restaurants;
CREATE TRIGGER trg_notify_admin_new_restaurant
    AFTER INSERT ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_restaurant();

-- Enable realtime for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
