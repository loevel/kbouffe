import { Hono } from 'hono';
import { CoreEnv as Env, CoreVariables as Variables } from '@kbouffe/module-core';
import type { SupplierOrderTrace, CreateTraceRequest } from '../lib/types.js';

export const traceRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Commission KBouffe : 3% de la valeur HT
const PLATFORM_FEE_RATE = 0.03;
// TVA sur frais plateforme uniquement : 19.25% (CGI Art.128 + CAC)
// Les produits bruts agricoles sont exonérés de TVA (CGI Art.131)
const TVA_RATE = 0.1925;

/**
 * POST /api/marketplace/trace
 * Enregistrer une transaction fournisseur → restaurant avec traçabilité légale
 * (Loi 2011/012 Art.15 — obligation de traçabilité)
 *
 * NOTE: La facture est émise DIRECTEMENT par le fournisseur au restaurant.
 * KBouffe perçoit uniquement des frais de plateforme (soumis à TVA 19.25%).
 * Les produits agricoles bruts sont exonérés de TVA (CGI Art.131).
 */
traceRoutes.post('/', async (c) => {
  try {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    if (!supabase || !restaurantId) return c.json({ error: 'Non autorisé' }, 401);
    const body = await c.req.json<CreateTraceRequest>();

    const {
      supplier_id, product_id, quantity, unit, unit_price,
      lot_number, harvest_date, expected_delivery_date, notes,
    } = body;

    if (!supplier_id || !product_id || !quantity || !unit || !unit_price) {
      return c.json({ error: 'Champs obligatoires : fournisseur, produit, quantité, unité, prix' }, 400);
    }
    if (quantity <= 0 || unit_price <= 0) {
      return c.json({ error: 'La quantité et le prix doivent être supérieurs à 0' }, 400);
    }

    // Vérifier que le fournisseur est actif et approuvé
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, kyc_status, is_active')
      .eq('id', supplier_id)
      .single();

    if (supplierError || !supplier || !supplier.is_active || supplier.kyc_status !== 'approved') {
      return c.json({ error: 'Fournisseur non disponible ou non approuvé' }, 422);
    }

    const total_price = quantity * unit_price;
    // Frais plateforme HT (3%)
    const platform_fee = Math.floor(total_price * PLATFORM_FEE_RATE);
    // TVA 19.25% sur les frais plateforme uniquement
    const platform_fee_tva = Math.floor(platform_fee * TVA_RATE);

    const { data, error } = await supabase
      .from('supplier_order_traces')
      .insert({
        supplier_id,
        product_id,
        restaurant_id: restaurantId,
        quantity,
        unit,
        unit_price,
        total_price,
        lot_number: lot_number || null,
        harvest_date: harvest_date || null,
        platform_fee,
        platform_fee_tva,
        expected_delivery_date: expected_delivery_date || null,
        delivery_status: 'pending',
        notes: notes?.trim() || null,
      })
      .select(`
        *,
        supplier:suppliers(id, name, phone),
        product:supplier_products(id, name, category, unit)
      `)
      .single();

    if (error) {
      console.error('Create trace error:', error);
      return c.json({ error: 'Erreur lors de l\'enregistrement de la transaction' }, 500);
    }

    return c.json({ success: true, trace: data as SupplierOrderTrace }, 201);
  } catch (err) {
    console.error('Error creating trace:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/marketplace/trace
 * Historique des transactions d'approvisionnement du restaurant
 * Filtre possible par supplier_id, delivery_status
 */
traceRoutes.get('/', async (c) => {
  try {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    if (!supabase || !restaurantId) return c.json({ error: 'Non autorisé' }, 401);
    const { supplier_id, delivery_status, page = '1' } = c.req.query();
    const pageNum = Math.max(1, parseInt(page, 10));
    const limit = 20;
    const offset = (pageNum - 1) * limit;

    let query = supabase
      .from('supplier_order_traces')
      .select(`
        *,
        supplier:suppliers(id, name, phone, region),
        product:supplier_products(id, name, category, unit)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (supplier_id) query = query.eq('supplier_id', supplier_id);
    if (delivery_status) query = query.eq('delivery_status', delivery_status);

    const { data, error } = await query;

    if (error) {
      console.error('Trace list error:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({
      success: true,
      traces: (data ?? []) as SupplierOrderTrace[],
      pagination: { page: pageNum, limit },
    });
  } catch (err) {
    console.error('Error listing traces:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PATCH /api/marketplace/trace/:traceId/status
 * Mettre à jour le statut de livraison d'une transaction
 */
traceRoutes.patch('/:traceId/status', async (c) => {
  try {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    if (!supabase || !restaurantId) return c.json({ error: 'Non autorisé' }, 401);
    const traceId = c.req.param('traceId');
    const { delivery_status, actual_delivery_date, dispute_reason } = await c.req.json();

    const validStatuses = ['pending', 'confirmed', 'delivered', 'disputed', 'cancelled'];
    if (!validStatuses.includes(delivery_status)) {
      return c.json({ error: 'Statut invalide' }, 400);
    }

    const updates: Record<string, unknown> = { delivery_status };
    if (actual_delivery_date) updates.actual_delivery_date = actual_delivery_date;
    if (dispute_reason && delivery_status === 'disputed') updates.dispute_reason = dispute_reason;

    const { data, error } = await supabase
      .from('supplier_order_traces')
      .update(updates)
      .eq('id', traceId)
      .eq('restaurant_id', restaurantId) // Sécurité : seul le restaurant peut modifier
      .select()
      .single();

    if (error) {
      console.error('Update trace status error:', error);
      return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
    }

    return c.json({ success: true, trace: data as SupplierOrderTrace });
  } catch (err) {
    console.error('Error updating trace status:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});
