-- =====================================================
-- Migration 036: Statut "scheduled" pour commandes programmées
-- =====================================================
-- Ajoute la valeur 'scheduled' dans l'enum order_status
-- scheduled_for (déjà présent via migration 006) = datetime cible
-- status = 'scheduled' tant que la commande n'est pas confirmée par le restaurant

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'scheduled' BEFORE 'pending';

-- Index pour lister efficacement les commandes programmées par restaurant et date
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for
  ON public.orders (restaurant_id, scheduled_for)
  WHERE scheduled_for IS NOT NULL AND status = 'scheduled';
