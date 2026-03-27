-- client_notifications: alertes de suivi commande pour les clients
CREATE TABLE IF NOT EXISTS public.client_notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id    UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type        TEXT NOT NULL, -- 'order_confirmed', 'order_preparing', 'order_ready', 'order_delivered', 'order_cancelled'
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_notifications_user_id_idx ON public.client_notifications(user_id);
CREATE INDEX IF NOT EXISTS client_notifications_is_read_idx ON public.client_notifications(user_id, is_read);

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "client_notifications: owner select"
    ON public.client_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "client_notifications: owner update"
    ON public.client_notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger: notify client when order status changes
CREATE OR REPLACE FUNCTION public.notify_client_order_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_title TEXT;
    v_body  TEXT;
    v_type  TEXT;
BEGIN
    -- Only notify if customer_id is set and status actually changed
    IF NEW.customer_id IS NULL OR NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    CASE NEW.status
        WHEN 'accepted' THEN
            v_type  := 'order_confirmed';
            v_title := 'Commande confirmee';
            v_body  := 'Votre commande a ete acceptee et sera prete dans ' || COALESCE(NEW.preparation_time_minutes::TEXT || ' min', 'quelques minutes') || '.';
        WHEN 'preparing' THEN
            v_type  := 'order_preparing';
            v_title := 'En preparation';
            v_body  := 'Votre commande est en cours de preparation.';
        WHEN 'ready' THEN
            v_type  := 'order_ready';
            v_title := 'Commande prete';
            v_body  := 'Votre commande est prete ! Venez la recuperer ou elle va vous etre livree.';
        WHEN 'delivered' THEN
            v_type  := 'order_delivered';
            v_title := 'Commande livree';
            v_body  := 'Votre commande a ete livree. Bon appetit !';
        WHEN 'completed' THEN
            v_type  := 'order_delivered';
            v_title := 'Commande completee';
            v_body  := 'Votre commande est terminee. Merci de votre confiance !';
        WHEN 'cancelled' THEN
            v_type  := 'order_cancelled';
            v_title := 'Commande annulee';
            v_body  := 'Votre commande a ete annulee. Contactez le restaurant pour plus d''informations.';
        ELSE
            RETURN NEW;
    END CASE;

    INSERT INTO public.client_notifications (user_id, order_id, type, title, body)
    VALUES (NEW.customer_id, NEW.id, v_type, v_title, v_body);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_client_order_status ON public.orders;
CREATE TRIGGER trg_notify_client_order_status
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.notify_client_order_status();

-- Enable realtime for client_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_notifications;
