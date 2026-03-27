import { Hono } from 'hono';
import { CoreEnv as Env, CoreVariables as Variables } from '@kbouffe/module-core';
import type { Supplier } from '../lib/types.js';

export const supplierAdminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/admin/marketplace/suppliers
 * Liste tous les fournisseurs pour l'admin (tous statuts KYC)
 */
supplierAdminRoutes.get('/', async (c) => {
  try {
    const supabase = c.var.supabase;
    const { kyc_status, region, type, page = '1' } = c.req.query();
    const pageNum = Math.max(1, parseInt(page, 10));
    const limit = 25;
    const offset = (pageNum - 1) * limit;

    let query = supabase
      .from('suppliers')
      .select('*, supplier_products(id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (kyc_status) query = query.eq('kyc_status', kyc_status);
    if (region) query = query.eq('region', region);
    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;

    if (error) {
      console.error('Admin suppliers list error:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({
      success: true,
      suppliers: (data ?? []) as Supplier[],
      pagination: { page: pageNum, limit, total: count ?? 0 },
    });
  } catch (err) {
    console.error('Error listing suppliers (admin):', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/admin/marketplace/suppliers/:id
 * Détail complet d'un fournisseur (dossier KYC)
 */
supplierAdminRoutes.get('/:id', async (c) => {
  try {
    const supabase = c.var.supabase;
    const supplierId = c.req.param('id');

    const { data, error } = await supabase
      .from('suppliers')
      .select('*, supplier_products(*)')
      .eq('id', supplierId)
      .single();

    if (error || !data) {
      return c.json({ error: 'Fournisseur introuvable' }, 404);
    }

    return c.json({ success: true, supplier: data as Supplier });
  } catch (err) {
    console.error('Error fetching supplier (admin):', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PATCH /api/admin/marketplace/suppliers/:id/kyc
 * Approuver ou rejeter un dossier KYC fournisseur
 * Body: { kyc_status: 'approved' | 'rejected' | 'suspended', rejection_reason?: string }
 */
supplierAdminRoutes.patch('/:id/kyc', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    const supplierId = c.req.param('id');
    const { kyc_status, rejection_reason } = await c.req.json();

    const validStatuses = ['approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(kyc_status)) {
      return c.json({ error: 'Statut KYC invalide' }, 400);
    }

    if (kyc_status === 'rejected' && !rejection_reason?.trim()) {
      return c.json({ error: 'Motif de rejet obligatoire' }, 400);
    }

    const updates: Record<string, unknown> = {
      kyc_status,
      kyc_verified_at: new Date().toISOString(),
      kyc_verified_by: userId,
      is_active: kyc_status === 'approved',
    };

    if (kyc_status === 'rejected' || kyc_status === 'suspended') {
      updates.kyc_rejection_reason = rejection_reason?.trim() || null;
    } else {
      updates.kyc_rejection_reason = null;
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', supplierId)
      .select('id, name, kyc_status, is_active, kyc_verified_at')
      .single();

    if (error) {
      console.error('KYC update error:', error);
      return c.json({ error: 'Erreur lors de la mise à jour KYC' }, 500);
    }

    const statusLabel: Record<string, string> = {
      approved: 'approuvé',
      rejected: 'rejeté',
      suspended: 'suspendu',
    };

    return c.json({
      success: true,
      message: `Fournisseur ${statusLabel[kyc_status]} avec succès`,
      supplier: data,
    });
  } catch (err) {
    console.error('Error updating KYC:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PATCH /api/admin/marketplace/suppliers/:id
 * Modifier un fournisseur (tier, featured, etc.)
 */
supplierAdminRoutes.patch('/:id', async (c) => {
  try {
    const supabase = c.var.supabase;
    const supplierId = c.req.param('id');
    const body = await c.req.json();

    const allowed = ['listing_tier', 'is_featured', 'is_active'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'Aucune modification fournie' }, 400);
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', supplierId)
      .select()
      .single();

    if (error) {
      console.error('Admin supplier update error:', error);
      return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
    }

    return c.json({ success: true, supplier: data as Supplier });
  } catch (err) {
    console.error('Error updating supplier (admin):', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/admin/marketplace/stats
 * Statistiques globales du marketplace fournisseurs
 */
supplierAdminRoutes.get('/stats', async (c) => {
  try {
    const supabase = c.var.supabase;

    const [pendingRes, approvedRes, totalProductsRes, tracesRes] = await Promise.all([
      supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
      supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('kyc_status', 'approved'),
      supabase.from('supplier_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('supplier_order_traces').select('total_price, platform_fee').gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
    ]);

    const traces = tracesRes.data ?? [];
    const totalVolume = traces.reduce((sum: number, t: { total_price: number }) => sum + t.total_price, 0);
    const totalFees = traces.reduce((sum: number, t: { platform_fee: number }) => sum + t.platform_fee, 0);

    return c.json({
      success: true,
      stats: {
        pending_kyc: pendingRes.count ?? 0,
        approved_suppliers: approvedRes.count ?? 0,
        active_products: totalProductsRes.count ?? 0,
        last_30_days: {
          transaction_count: traces.length,
          total_volume_fcfa: totalVolume,
          total_platform_fees_fcfa: totalFees,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching supplier stats (admin):', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});
