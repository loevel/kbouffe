import { Hono } from 'hono';
import type {
  MarketplaceInitiatePurchaseRequest,
  RestaurantPackSubscription
} from '../lib/types.js';
import { validateInitiatePurchase } from '../lib/validation.js';

export const merchantRoutes = new Hono();

/**
 * GET /api/marketplace/my-packs
 * Récupère les souscriptions actives du restaurant du merchant
 */
merchantRoutes.get('/my-packs', async (c) => {
  try {
    const supabase = c.get('supabase');
    const restaurantId = c.get('restaurantId');

    if (!supabase || !restaurantId) {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const { data, error } = await supabase
      .rpc('get_active_packs_for_restaurant', { p_restaurant_id: restaurantId });

    if (error) {
      console.error('Error fetching active packs:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Error in my-packs:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/marketplace/subscriptions
 * Récupère toutes les souscriptions (actives et inactives) du restaurant
 */
merchantRoutes.get('/subscriptions', async (c) => {
  try {
    const supabase = c.get('supabase');
    const restaurantId = c.get('restaurantId');

    if (!supabase || !restaurantId) {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const { data, error } = await supabase
      .from('restaurant_pack_subscriptions')
      .select(
        'id, pack_id, status, price_paid, currency, starts_at, expires_at, created_at, marketplace_packs(name, type, slug)'
      )
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Error in subscriptions:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/marketplace/purchase
 * Initie l'achat d'un pack (crée subscription + transaction paiement)
 */
merchantRoutes.post('/purchase', async (c) => {
  try {
    const supabase = c.get('supabase');
    const restaurantId = c.get('restaurantId');
    const userId = c.get('userId');

    if (!supabase || !restaurantId || !userId) {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const body = await c.req.json();

    if (!validateInitiatePurchase(body)) {
      return c.json({
        error: 'Données invalides: pack_id et payer_msisdn (string) requis'
      }, 400);
    }

    const { pack_id, payer_msisdn } = body;

    // Appeler la stored procedure
    const { data, error } = await supabase
      .rpc('marketplace_initiate_purchase', {
        p_restaurant_id: restaurantId,
        p_pack_id: pack_id,
        p_payer_msisdn: payer_msisdn,
      });

    if (error) {
      console.error('Error initiating purchase:', error);
      return c.json({ error: error.message || 'Erreur lors de l\'initiation' }, 400);
    }

    if (!data || data.length === 0) {
      return c.json({ error: 'Impossible de créer la souscription' }, 500);
    }

    const { subscription_id, transaction_id, reference_id } = data[0];

    // Récupérer le prix du pack pour la réponse
    const { data: packData } = await supabase
      .from('marketplace_packs')
      .select('price')
      .eq('id', pack_id)
      .single();

    return c.json({
      success: true,
      data: {
        subscription_id,
        transaction_id,
        reference_id,
        amount: packData?.price || 0,
        currency: 'XAF',
      },
    });
  } catch (err) {
    console.error('Error in purchase:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/marketplace/cancel/:subscriptionId
 * Annule une souscription (si non encore activée)
 */
merchantRoutes.post('/cancel/:subscriptionId', async (c) => {
  try {
    const supabase = c.get('supabase');
    const restaurantId = c.get('restaurantId');
    const subscriptionId = c.req.param('subscriptionId');

    if (!supabase || !restaurantId) {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    // Vérifier que le merchant owne cette souscription
    const { data: sub, error: subError } = await supabase
      .from('restaurant_pack_subscriptions')
      .select('id, status, restaurant_id')
      .eq('id', subscriptionId)
      .single();

    if (subError || !sub || sub.restaurant_id !== restaurantId) {
      return c.json({ error: 'Souscription non trouvée' }, 404);
    }

    if (sub.status === 'active') {
      return c.json({ 
        error: 'Impossible d\'annuler une souscription active. Contact support.' 
      }, 400);
    }

    // Annuler
    const { error } = await supabase
      .from('restaurant_pack_subscriptions')
      .update({ status: 'cancelled', cancellation_reason: 'Annulation par merchant' })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, message: 'Souscription annulée' });
  } catch (err) {
    console.error('Error in cancel:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default merchantRoutes;
