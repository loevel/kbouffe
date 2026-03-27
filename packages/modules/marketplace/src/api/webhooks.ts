import { Hono } from 'hono';
import type { MarketplaceWebhookPayload } from '../lib/types.js';
import { validateWebhookPayload } from '../lib/validation.js';

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

    const payload = await c.req.json();

    if (!validateWebhookPayload(payload)) {
      return c.json({
        error: 'Données invalides: reference_id et status (paid|failed) requis'
      }, 400);
    }

    const { reference_id, external_id, status } = payload;

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

      // Annuler la souscription via stored procedure
      await supabase.rpc('marketplace_cancel_on_payment_failure', {
        p_reference_id: reference_id,
      }).catch((err) => {
        console.error('Error cancelling subscription on payment failure:', err);
      });

      return c.json({ success: true, message: 'Paiement marqué comme échoué' });
    }

    return c.json({ error: 'Statut de paiement inconnu' }, 400);
  } catch (err) {
    console.error('Error in marketplace webhook:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default webhookRoutes;
