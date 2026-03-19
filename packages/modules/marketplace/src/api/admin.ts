import { Hono } from 'hono';
import type { MarketplacePack } from '../lib/types.js';

export const adminRoutes = new Hono();

/**
 * GET /api/admin/marketplace/packs
 * Récupère tous les packs (actifs et inactifs)
 */
adminRoutes.get('/packs', async (c) => {
  try {
    const supabase = c.get('supabase');
    const user = c.get('user');

    if (!supabase || !user || user.role !== 'admin') {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const { data, error } = await supabase
      .from('marketplace_packs')
      .select('*')
      .order('sort_order', { ascending: false });

    if (error) {
      console.error('Error fetching packs (admin):', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, data: data as MarketplacePack[] });
  } catch (err) {
    console.error('Error in admin packs:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/admin/marketplace/packs
 * Crée un nouveau pack
 */
adminRoutes.post('/packs', async (c) => {
  try {
    const supabase = c.get('supabase');
    const user = c.get('user');

    if (!supabase || !user || user.role !== 'admin') {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const body = await c.req.json() as Partial<MarketplacePack>;
    const { name, slug, type, price, duration_days, description, features, is_active, sort_order } = body;

    if (!name || !slug || !type || price === undefined || !duration_days) {
      return c.json({ error: 'Données manquantes' }, 400);
    }

    const { data, error } = await supabase
      .from('marketplace_packs')
      .insert({
        name,
        slug,
        type,
        price,
        duration_days,
        description: description || null,
        features: features || [],
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pack:', error);
      return c.json({ error: error.message || 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, data });
  } catch (err) {
    console.error('Error in create pack:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/admin/marketplace/packs/:id
 * Modifie un pack
 */
adminRoutes.put('/packs/:id', async (c) => {
  try {
    const supabase = c.get('supabase');
    const user = c.get('user');
    const packId = c.req.param('id');

    if (!supabase || !user || user.role !== 'admin') {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const body = await c.req.json() as Partial<MarketplacePack>;

    const { data, error } = await supabase
      .from('marketplace_packs')
      .update(body)
      .eq('id', packId)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating pack:', error);
      return c.json({ error: 'Pack non trouvé ou erreur serveur' }, 500);
    }

    return c.json({ success: true, data });
  } catch (err) {
    console.error('Error in update pack:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * DELETE /api/admin/marketplace/packs/:id
 * Désactive un pack (soft delete via is_active = false)
 */
adminRoutes.delete('/packs/:id', async (c) => {
  try {
    const supabase = c.get('supabase');
    const user = c.get('user');
    const packId = c.req.param('id');

    if (!supabase || !user || user.role !== 'admin') {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const { error } = await supabase
      .from('marketplace_packs')
      .update({ is_active: false })
      .eq('id', packId);

    if (error) {
      console.error('Error deleting pack:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, message: 'Pack désactivé' });
  } catch (err) {
    console.error('Error in delete pack:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/admin/marketplace/subscriptions
 * Récupère toutes les souscriptions (admin)
 */
adminRoutes.get('/subscriptions', async (c) => {
  try {
    const supabase = c.get('supabase');
    const user = c.get('user');

    if (!supabase || !user || user.role !== 'admin') {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const status = c.req.query('status');
    let query = supabase
      .from('restaurant_pack_subscriptions')
      .select(
        'id, restaurant_id, pack_id, status, price_paid, starts_at, expires_at, created_at, restaurants(name, slug), marketplace_packs(name, type)'
      );

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions (admin):', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Error in admin subscriptions:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/admin/marketplace/subscriptions/:id/refund
 * Rembourse une souscription (admin)
 */
adminRoutes.post('/subscriptions/:id/refund', async (c) => {
  try {
    const supabase = c.get('supabase');
    const user = c.get('user');
    const subscriptionId = c.req.param('id');

    if (!supabase || !user || user.role !== 'admin') {
      return c.json({ error: 'Non autorisé' }, 401);
    }

    const body = await c.req.json() as { reason?: string };
    const reason = body.reason || 'Remboursement administrateur';

    // Récupérer la souscription
    const { data: sub, error: subError } = await supabase
      .from('restaurant_pack_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !sub) {
      return c.json({ error: 'Souscription non trouvée' }, 404);
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('restaurant_pack_subscriptions')
      .update({
        status: 'refunded',
        cancellation_reason: reason,
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error refunding subscription:', updateError);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    // Créer une entrée ledger pour le remboursement
    if (sub.payment_transaction_id) {
      await supabase.from('ledger_entries').insert({
        restaurant_id: sub.restaurant_id,
        payment_transaction_id: sub.payment_transaction_id,
        entry_type: 'marketplace_refund',
        direction: 'credit',
        amount: sub.price_paid,
        currency: sub.currency,
        description: `Remboursement pack marketplace: ${reason}`,
      });
    }

    return c.json({ success: true, message: 'Remboursement appliqué' });
  } catch (err) {
    console.error('Error in refund:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default adminRoutes;
