import { Hono } from 'hono';
import { CoreEnv as Env, CoreVariables as Variables } from '@kbouffe/module-core';
import type { MarketplacePack } from '../lib/types.js';
import { validateMarketplacePack, packTypes } from '../lib/validation.js';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/admin/marketplace/packs
 * Récupère tous les packs (actifs et inactifs).
 * Auth: adminMiddleware (monté au niveau apps/api/src/index.ts).
 */
adminRoutes.get('/packs', async (c) => {
  try {
    const supabase = c.var.supabase;

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
 * Crée un nouveau pack.
 */
adminRoutes.post('/packs', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;

    const body = await c.req.json();

    if (!validateMarketplacePack(body)) {
      return c.json({
        error: 'Données invalides: name, slug, type (string) requis',
      }, 400);
    }

    const {
      name, slug, type, price, duration_days, description,
      features, limits, badge_color, image_url, is_active, is_featured, sort_order,
    } = body;

    if (price === undefined || duration_days === undefined) {
      return c.json({
        error: 'Données manquantes: price et duration_days (number) requis',
      }, 400);
    }

    if (!packTypes.includes(type as typeof packTypes[number])) {
      return c.json({
        error: `Type invalide. Types autorisés: ${packTypes.join(', ')}`,
      }, 400);
    }

    const { data, error } = await (supabase as any)
      .from('marketplace_packs')
      .insert({
        name,
        slug,
        type,
        price,
        duration_days,
        description: description || null,
        features: features || [],
        limits: limits || {},
        badge_color: badge_color || null,
        image_url: image_url || null,
        is_active: is_active ?? true,
        is_featured: is_featured ?? false,
        sort_order: sort_order ?? 0,
        created_by: userId,
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
 * Modifie un pack.
 */
adminRoutes.put('/packs/:id', async (c) => {
  try {
    const supabase = c.var.supabase;
    const packId = c.req.param('id');

    const body = await c.req.json() as Partial<MarketplacePack>;

    const { data, error } = await (supabase as any)
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
 * Désactive un pack (soft delete via is_active = false).
 */
adminRoutes.delete('/packs/:id', async (c) => {
  try {
    const supabase = c.var.supabase;
    const packId = c.req.param('id');

    const { error } = await (supabase as any)
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
 * Récupère toutes les souscriptions.
 */
adminRoutes.get('/subscriptions', async (c) => {
  try {
    const supabase = c.var.supabase;
    const status = c.req.query('status');

    let query = supabase
      .from('restaurant_pack_subscriptions')
      .select(
        'id, restaurant_id, pack_id, status, price_paid, starts_at, expires_at, created_at, restaurants(name, slug), marketplace_packs(name, type)',
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
 * Rembourse une souscription.
 */
adminRoutes.post('/subscriptions/:id/refund', async (c) => {
  try {
    const supabase = c.var.supabase;
    const subscriptionId = c.req.param('id');

    const body = await c.req.json() as { reason?: string };
    const reason = body.reason || 'Remboursement administrateur';

    const { data: sub, error: subError } = await supabase
      .from('restaurant_pack_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !sub) {
      return c.json({ error: 'Souscription non trouvée' }, 404);
    }
    const subRow = sub as any;

    const { error: updateError } = await (supabase as any)
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

    if (subRow.payment_transaction_id) {
      await (supabase as any).from('ledger_entries').insert({
        restaurant_id: subRow.restaurant_id,
        payment_transaction_id: subRow.payment_transaction_id,
        entry_type: 'marketplace_refund',
        direction: 'credit',
        amount: subRow.price_paid,
        currency: subRow.currency,
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
