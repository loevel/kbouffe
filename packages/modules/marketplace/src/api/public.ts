import { Hono } from 'hono';
import { CoreEnv as Env, CoreVariables as Variables } from '@kbouffe/module-core';
import type { MarketplacePack } from '../lib/types.js';

export const publicRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/marketplace/packs
 * Récupère la liste des packs actifs et visibles
 */
publicRoutes.get('/packs', async (c) => {
  try {
    const supabase = c.var.supabase;
    if (!supabase) {
      return c.json({ error: 'Service indisponible' }, 503);
    }

    const { data, error } = await supabase
      .from('marketplace_packs')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: false });

    if (error) {
      console.error('Marketplace packs fetch error:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, data: data as MarketplacePack[] });
  } catch (err) {
    console.error('Error fetching marketplace packs:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/marketplace/packs/:id
 * Récupère les détails d'un pack spécifique
 */
publicRoutes.get('/packs/:id', async (c) => {
  try {
    const packId = c.req.param('id');
    const supabase = c.var.supabase;
    if (!supabase) {
      return c.json({ error: 'Service indisponible' }, 503);
    }

    const { data, error } = await supabase
      .from('marketplace_packs')
      .select('*')
      .eq('id', packId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return c.json({ error: 'Pack non trouvé' }, 404);
    }

    return c.json({ success: true, data: data as MarketplacePack });
  } catch (err) {
    console.error('Error fetching pack:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default publicRoutes;
