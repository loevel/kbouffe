import { Hono } from 'hono';
import { CoreEnv as Env, CoreVariables as Variables } from '@kbouffe/module-core';
import type {
  Supplier,
  SupplierProduct,
  RegisterSupplierRequest,
  CreateSupplierProductRequest,
  SupplierFilters,
} from '../lib/types.js';

export const suppliersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ──────────────────────────────────────────────────────────────────────
//  PUBLIC — Annuaire des fournisseurs approuvés
// ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/marketplace/suppliers
 * Liste publique des fournisseurs actifs et approuvés avec filtres
 */
suppliersRoutes.get('/', async (c) => {
  try {
    const supabase = c.var.supabase;
    const {
      region, category, type, page = '1',
      q,        // search by supplier name
      product,  // search by product name
      locality, // filter by city/locality
      organic,  // '1' = bio only
      featured, // '1' = featured only
    } = c.req.query() as SupplierFilters & {
      page?: string; q?: string; product?: string;
      locality?: string; organic?: string; featured?: string;
    };
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limit = 20;
    const offset = (pageNum - 1) * limit;

    // If searching by product name, find matching supplier IDs first
    let productMatchIds: string[] | null = null;
    if (product?.trim()) {
      const { data: productMatches } = await supabase
        .from('supplier_products')
        .select('supplier_id')
        .ilike('name', `%${product.trim()}%`)
        .eq('is_active', true);
      productMatchIds = productMatches
        ? [...new Set(productMatches.map((p: { supplier_id: string }) => p.supplier_id))]
        : [];
    }

    let query = supabase
      .from('suppliers')
      .select(`
        id, name, type, contact_name, phone, region, locality,
        description, logo_url, minader_cert_url, is_featured,
        listing_tier, created_at,
        supplier_products(id, name, category, price_per_unit, unit, is_active, is_organic, photos)
      `)
      .eq('is_active', true)
      .eq('kyc_status', 'approved')
      .order('is_featured', { ascending: false })
      .order('listing_tier', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (region) query = query.eq('region', region);
    if (type) query = query.eq('type', type);
    if (q?.trim()) query = query.ilike('name', `%${q.trim()}%`);
    if (locality?.trim()) query = query.ilike('locality', `%${locality.trim()}%`);
    if (featured === '1') query = query.eq('is_featured', true);
    if (productMatchIds !== null) {
      if (productMatchIds.length === 0) {
        // No matching products — return empty result immediately
        return c.json({ success: true, suppliers: [], pagination: { page: pageNum, limit, total: 0 } });
      }
      query = query.in('id', productMatchIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Suppliers list error:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    let suppliers = (data ?? []) as unknown as Supplier[];

    // Client-side filters (on joined data)
    if (category) {
      suppliers = suppliers.filter((s) =>
        s.products?.some((p) => p.category === category && p.is_active)
      );
    }
    if (organic === '1') {
      suppliers = suppliers.filter((s) =>
        s.products?.some((p) => p.is_organic && p.is_active)
      );
    }

    return c.json({
      success: true,
      suppliers,
      pagination: { page: pageNum, limit, total: suppliers.length },
    });
  } catch (err) {
    console.error('Error listing suppliers:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────
//  SELF-SERVICE — Fournisseur authentifié gérant son propre compte
//  IMPORTANT: ces routes /me doivent être AVANT /:id pour éviter le conflit
// ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/marketplace/suppliers/me
 * Récupère le profil du fournisseur connecté (y compris si KYC pending)
 */
suppliersRoutes.get('/me', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Non autorisé' }, 401);

    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        supplier_products(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return c.json({ error: 'Aucun profil fournisseur trouvé pour ce compte' }, 404);
    }

    return c.json({ success: true, supplier: data });
  } catch (err) {
    console.error('Error fetching supplier me:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PATCH /api/marketplace/suppliers/me
 * Mise à jour du profil fournisseur (champs non-KYC uniquement)
 */
suppliersRoutes.patch('/me', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Non autorisé' }, 401);

    const body = await c.req.json<Record<string, unknown>>();

    const allowed = [
      'description', 'logo_url', 'cover_url', 'address', 'gps_lat', 'gps_lng', 'locality',
      'gallery', 'social_links', 'delivery_zones', 'payment_methods',
      'delivery_delay_days', 'specialties', 'processing_delay_days',
      // Résultats KYC face liveness (scores uniquement — pas de biométrie brute)
      'kyc_face_verified', 'kyc_face_score', 'kyc_name_match', 'kyc_confidence',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = (body as Record<string, unknown>)[key];
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'Aucune modification fournie' }, 400);
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update supplier me error:', error);
      return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
    }

    return c.json({ success: true, supplier: data });
  } catch (err) {
    console.error('Error updating supplier me:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/marketplace/suppliers/me/products
 * Liste tous les produits du fournisseur connecté (actifs + inactifs)
 */
suppliersRoutes.get('/me/products', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Non autorisé' }, 401);

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, kyc_status')
      .eq('user_id', userId)
      .single();

    if (!supplier) return c.json({ error: 'Profil fournisseur introuvable' }, 404);

    const { data, error } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false });

    if (error) return c.json({ error: 'Erreur serveur' }, 500);

    return c.json({
      success: true,
      products: data ?? [],
      kyc_status: supplier.kyc_status,
    });
  } catch (err) {
    console.error('Error fetching my products:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/marketplace/suppliers/me/products
 * Ajouter un produit à mon catalogue (KYC approved requis)
 */
suppliersRoutes.post('/me/products', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Non autorisé' }, 401);

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, kyc_status')
      .eq('user_id', userId)
      .single();

    if (!supplier) return c.json({ error: 'Profil fournisseur introuvable' }, 404);
    if (supplier.kyc_status !== 'approved') {
      return c.json({ error: 'Votre dossier KYC est en attente de validation — vous pourrez ajouter des produits une fois approuvé' }, 403);
    }

    const body = await c.req.json<CreateSupplierProductRequest & { photos?: string[] }>();
    const {
      name, category, price_per_unit, unit,
      description, min_order_quantity, available_quantity,
      origin_region, harvest_date, allergens,
      is_organic, phytosanitary_note, photos,
    } = body;

    if (!name?.trim() || !category || !price_per_unit || !unit) {
      return c.json({ error: 'Champs obligatoires : nom, catégorie, prix, unité' }, 400);
    }
    if (price_per_unit <= 0) {
      return c.json({ error: 'Le prix doit être supérieur à 0 FCFA' }, 400);
    }
    const photosList = Array.isArray(photos) ? photos : [];
    if (photosList.length < 1) {
      return c.json({ error: 'Au moins 1 photo est requise pour le produit' }, 400);
    }
    if (photosList.length > 5) {
      return c.json({ error: 'Maximum 5 photos autorisées par produit' }, 400);
    }

    const { data, error } = await supabase
      .from('supplier_products')
      .insert({
        supplier_id: supplier.id,
        name: name.trim(),
        category,
        description: description?.trim() || null,
        price_per_unit,
        unit,
        photos: photosList,
        min_order_quantity: min_order_quantity ?? 1,
        available_quantity: available_quantity ?? null,
        origin_region: origin_region?.trim() || null,
        harvest_date: harvest_date || null,
        lot_number: null,
        allergens: allergens ?? [],
        is_organic: is_organic ?? false,
        phytosanitary_note: phytosanitary_note?.trim() || null,
      })
      .select()
      .single();

    if (error) return c.json({ error: 'Erreur lors de la création du produit' }, 500);

    return c.json({ success: true, product: data as SupplierProduct }, 201);
  } catch (err) {
    console.error('Error creating my product:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/marketplace/suppliers/me/orders
 * Commandes reçues par le fournisseur (traces de traçabilité)
 */
suppliersRoutes.get('/me/orders', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Non autorisé' }, 401);

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!supplier) return c.json({ error: 'Profil fournisseur introuvable' }, 404);

    const { data, error } = await supabase
      .from('supplier_order_traces')
      .select(`
        *,
        supplier_products(name, unit, category)
      `)
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return c.json({ error: 'Erreur serveur' }, 500);

    const totalRevenue = (data ?? []).reduce((sum: number, t: Record<string, unknown>) => {
      return sum + (typeof t.total_price === 'number' ? t.total_price : 0);
    }, 0);

    return c.json({
      success: true,
      orders: data ?? [],
      summary: {
        total_orders: data?.length ?? 0,
        total_revenue_fcfa: totalRevenue,
      },
    });
  } catch (err) {
    console.error('Error fetching my orders:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PATCH /api/marketplace/suppliers/me/orders/:orderId
 * Le fournisseur confirme ou marque comme livrée une commande
 * Transitions autorisées : pending → confirmed → delivered
 */
suppliersRoutes.patch('/me/orders/:orderId', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Non autorisé' }, 401);

    const orderId = c.req.param('orderId');
    const { delivery_status } = await c.req.json<{ delivery_status: string }>();

    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      pending: ['confirmed'],
      confirmed: ['delivered'],
    };

    // Récupérer le fournisseur et l'ordre
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!supplier) return c.json({ error: 'Profil fournisseur introuvable' }, 404);

    const { data: order } = await supabase
      .from('supplier_order_traces')
      .select('id, delivery_status')
      .eq('id', orderId)
      .eq('supplier_id', supplier.id)
      .single();

    if (!order) return c.json({ error: 'Commande introuvable' }, 404);

    const allowed = ALLOWED_TRANSITIONS[order.delivery_status as string] ?? [];
    if (!allowed.includes(delivery_status)) {
      return c.json({
        error: `Transition non autorisée : ${order.delivery_status} → ${delivery_status}`,
      }, 400);
    }

    const updateData: Record<string, unknown> = { delivery_status };
    if (delivery_status === 'delivered') {
      updateData.actual_delivery_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('supplier_order_traces')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Update order status error:', error);
      return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
    }

    return c.json({ success: true, order: data });
  } catch (err) {
    console.error('Error updating order status:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/marketplace/suppliers/:id
 * Profil public d'un fournisseur avec ses produits actifs
 */
suppliersRoutes.get('/:id', async (c) => {
  try {
    const supabase = c.var.supabase;
    const supplierId = c.req.param('id');

    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        supplier_products(*)
      `)
      .eq('id', supplierId)
      .eq('is_active', true)
      .eq('kyc_status', 'approved')
      .single();

    if (error || !data) {
      return c.json({ error: 'Fournisseur introuvable' }, 404);
    }

    return c.json({ success: true, supplier: data as Supplier });
  } catch (err) {
    console.error('Error fetching supplier:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────
//  INSCRIPTION — Inscription d'un nouveau fournisseur (KYC pending)
//  Pas d'auth requise — formulaire public d'inscription
// ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/marketplace/suppliers/register
 * Inscription d'un agriculteur/coopérative/grossiste
 * KYC status = 'pending' → activé uniquement après validation admin
 */
suppliersRoutes.post('/register', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Veuillez vous connecter avant de vous inscrire comme fournisseur' }, 401);

    // Vérifier qu'il n'y a pas déjà un profil fournisseur pour ce compte
    const { data: existing } = await supabase
      .from('suppliers')
      .select('id, kyc_status')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return c.json({
        error: 'Un profil fournisseur existe déjà pour ce compte',
        existing_id: existing.id,
        kyc_status: existing.kyc_status,
      }, 409);
    }

    const body = await c.req.json<RegisterSupplierRequest>();

    const {
      name, type, contact_name, phone, region, locality,
      email, description, identity_doc_url,
      rccm, nif, minader_cert_url, cooperative_number,
      phytosanitary_declaration,
    } = body;

    // Validation des champs obligatoires
    if (!name?.trim() || !type || !contact_name?.trim() || !phone?.trim() || !region || !locality?.trim()) {
      return c.json({ error: 'Champs obligatoires manquants : nom, type, contact, téléphone, région, localité' }, 400);
    }

    // Validation selon le type (AUDCG Art.35)
    if (type === 'wholesaler') {
      if (!rccm?.trim() || !nif?.trim()) {
        return c.json({ error: 'RCCM et NIF obligatoires pour les grossistes (AUDCG Art.35)' }, 400);
      }
    }
    if (type === 'cooperative' && !cooperative_number?.trim()) {
      return c.json({ error: 'Numéro de coopérative obligatoire' }, 400);
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        user_id: userId,
        name: name.trim(),
        type,
        contact_name: contact_name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        description: description?.trim() || null,
        region,
        locality: locality.trim(),
        identity_doc_url: identity_doc_url || null,
        rccm: rccm?.trim() || null,
        nif: nif?.trim() || null,
        minader_cert_url: minader_cert_url || null,
        cooperative_number: cooperative_number?.trim() || null,
        phytosanitary_declaration: phytosanitary_declaration?.trim() || null,
        kyc_status: 'pending',
        is_active: false,
      })
      .select('id, name, kyc_status')
      .single();

    if (error) {
      console.error('Supplier registration error:', error);
      return c.json({ error: 'Erreur lors de l\'inscription' }, 500);
    }

    return c.json(
      {
        success: true,
        message: 'Inscription reçue. Votre dossier est en cours de vérification. Vous serez contacté(e) sous 48h.',
        id: data.id,
      },
      201,
    );
  } catch (err) {
    console.error('Error registering supplier:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────
//  GESTION PRODUITS — Routes pour les fournisseurs (auth requise)
// ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/marketplace/suppliers/:id/products
 * Liste des produits d'un fournisseur (y compris inactifs pour le fournisseur lui-même)
 */
suppliersRoutes.get('/:id/products', async (c) => {
  try {
    const supabase = c.var.supabase;
    const supplierId = c.req.param('id');

    const { data, error } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supplier products error:', error);
      return c.json({ error: 'Erreur serveur' }, 500);
    }

    return c.json({ success: true, products: (data ?? []) as SupplierProduct[] });
  } catch (err) {
    console.error('Error listing supplier products:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/marketplace/suppliers/:id/products
 * Ajouter un produit au catalogue du fournisseur (auth requise)
 */
suppliersRoutes.post('/:id/products', async (c) => {
  try {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    if (!supabase || !restaurantId) return c.json({ error: 'Non autorisé' }, 401);
    const supplierId = c.req.param('id');
    const body = await c.req.json<CreateSupplierProductRequest>();

    const {
      name, category, price_per_unit, unit,
      description, min_order_quantity, available_quantity,
      origin_region, harvest_date, allergens,
      is_organic, phytosanitary_note,
    } = body;

    if (!name?.trim() || !category || !price_per_unit || !unit) {
      return c.json({ error: 'Champs obligatoires : nom, catégorie, prix, unité' }, 400);
    }
    if (price_per_unit <= 0) {
      return c.json({ error: 'Le prix doit être supérieur à 0 FCFA' }, 400);
    }

    // Vérifier que le fournisseur est approuvé
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, kyc_status')
      .eq('id', supplierId)
      .single();

    if (!supplier || supplier.kyc_status !== 'approved') {
      return c.json({ error: 'Fournisseur non approuvé — produit ne peut pas être ajouté' }, 403);
    }

    const { data, error } = await supabase
      .from('supplier_products')
      .insert({
        supplier_id: supplierId,
        name: name.trim(),
        category,
        description: description?.trim() || null,
        photos: [],
        price_per_unit,
        unit,
        min_order_quantity: min_order_quantity ?? 1,
        available_quantity: available_quantity ?? null,
        origin_region: origin_region?.trim() || null,
        harvest_date: harvest_date || null,
        lot_number: null,
        allergens: allergens ?? [],
        is_organic: is_organic ?? false,
        phytosanitary_note: phytosanitary_note?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create supplier product error:', error);
      return c.json({ error: 'Erreur lors de la création du produit' }, 500);
    }

    return c.json({ success: true, product: data as SupplierProduct }, 201);
  } catch (err) {
    console.error('Error creating supplier product:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PATCH /api/marketplace/supplier-products/:productId
 * Mettre à jour un produit
 */
suppliersRoutes.patch('/supplier-products/:productId', async (c) => {
  try {
    const supabase = c.var.supabase;
    const productId = c.req.param('productId');
    const body = await c.req.json<Partial<CreateSupplierProductRequest>>();

    const allowed = [
      'name', 'category', 'description', 'price_per_unit', 'unit', 'min_order_quantity',
      'available_quantity', 'origin_region', 'harvest_date', 'allergens',
      'is_organic', 'phytosanitary_note', 'is_active', 'photos',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = (body as Record<string, unknown>)[key];
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'Aucune modification fournie' }, 400);
    }

    // Validate photos array if provided
    if ('photos' in updates) {
      const photosList = updates.photos as unknown[];
      if (!Array.isArray(photosList) || photosList.length < 1) {
        return c.json({ error: 'Au moins 1 photo est requise pour le produit' }, 400);
      }
      if (photosList.length > 5) {
        return c.json({ error: 'Maximum 5 photos autorisées par produit' }, 400);
      }
    }

    const { data, error } = await supabase
      .from('supplier_products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Update supplier product error:', error);
      return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
    }

    return c.json({ success: true, product: data as SupplierProduct });
  } catch (err) {
    console.error('Error updating supplier product:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * DELETE /api/marketplace/supplier-products/:productId
 * Supprimer un produit
 */
suppliersRoutes.delete('/supplier-products/:productId', async (c) => {
  try {
    const supabase = c.var.supabase;
    const productId = c.req.param('productId');

    const { error } = await supabase
      .from('supplier_products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Delete supplier product error:', error);
      return c.json({ error: 'Erreur lors de la suppression' }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Error deleting supplier product:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});
