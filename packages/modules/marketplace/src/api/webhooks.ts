import { Hono } from 'hono';
import type { MarketplaceWebhookPayload } from '../lib/types.js';

export const webhookRoutes = new Hono();

/**
 * POST /api/marketplace/webhook/mtn
 * Reçoit la notification de paiement MTN MoMo et confirme la souscription
 * Sécurisé par clé service Cloudflare Worker secret
 */
webhookRoutes.post('/mtn', async (c) => {
  try {
    // Vérifier la signature/un token secret
    const authorization = c.req.header('Authorization');
    const expectedSecret = c.env?.MARKETPLACE_WEBHOOK_SECRET;

    if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
      console.warn('Unauthorized webhook call');
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const supabase = c.get('supabase');
    if (!supabase) {
      return c.json({ error: 'Service indisponible' }, 503);
    }

    const payload = await c.req.json() as MarketplaceWebhookPayload;
    const { reference_id, external_id, status } = payload;

    if (!reference_id || !status) {
      return c.json({ error: 'Données manquantes' }, 400);
    }

    if (status === 'paid') {
      // Confirmer le paiement via stored procedure
      const { error } = await supabase.rpc('marketplace_confirm_payment', {
        p_reference_id: reference_id,
        p_external_id: external_id || null,
      });

      if (error) {
        console.error('Error confirming marketplace payment:', error);
        return c.json({ error: error.message }, 400);
      }

      return c.json({ success: true, message: 'Paiement confirmé' });
    } else if (status === 'failed') {
      // Marquer la transaction comme échouée
      const { error } = await supabase
        .from('payment_transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('reference_id', reference_id)
        .eq('context', 'marketplace');

      if (error) {
        console.error('Error marking payment as failed:', error);
        return c.json({ error: 'Erreur serveur' }, 500);
      }

      // Annuler la souscription
      const { data: tx } = await supabase
        .from('payment_transactions')
        .select('marketplace_subscription_id')
        .eq('reference_id', reference_id)
        .single();

      if (tx?.marketplace_subscription_id) {
        await supabase
          .from('restaurant_pack_subscriptions')
          .update({ status: 'cancelled', cancellation_reason: 'Paiement échoué' })
          .eq('id', tx.marketplace_subscription_id);
      }

      return c.json({ success: true, message: 'Paiement marqué comme échoué' });
    }

    return c.json({ error: 'Statut de paiement inconnu' }, 400);
  } catch (err) {
    console.error('Error in marketplace webhook:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default webhookRoutes;
