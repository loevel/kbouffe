import { Hono } from 'hono';
import { CoreEnv as Env, CoreVariables as Variables } from '@kbouffe/module-core';

/**
 * Messagerie fournisseur (B2B).
 *
 * Les restaurants envoient des messages (devis/RFQ, renseignements, notes,
 * réclamations) aux fournisseurs ; les fournisseurs les lisent, y répondent
 * et les archivent.
 *
 * Ownership : appliqué par les RLS sur `supplier_messages`
 *   - sm_restaurant_all          : restaurant_id ∈ restaurants(owner_id = auth.uid())
 *   - sm_supplier_select_update  : supplier_id   ∈ suppliers(user_id  = auth.uid())
 * Le client est scopé par le JWT, donc un acteur ne voit/modifie que ses lignes.
 */
export const marketplaceMessagesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const MESSAGE_TYPES = ['rfq', 'inquiry', 'order_note', 'complaint'] as const;
const PATCH_STATUSES = ['read', 'replied', 'archived'] as const;
const SELECT = '*, restaurants(id, name, city, logo_url)';

/**
 * GET /api/marketplace/messages?role=supplier|restaurant
 * Liste les messages du fournisseur courant (défaut) ou du restaurant courant.
 */
marketplaceMessagesRoutes.get('/', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Non autorisé' }, 401);

    const role = c.req.query('role') === 'restaurant' ? 'restaurant' : 'supplier';

    let query = supabase
      .from('supplier_messages')
      .select(SELECT)
      .order('created_at', { ascending: false });

    if (role === 'supplier') {
      const { data: supplier } = await supabase
        .from('suppliers').select('id').eq('user_id', userId).maybeSingle();
      if (!supplier) return c.json({ error: 'Aucun profil fournisseur pour ce compte' }, 404);
      query = query.eq('supplier_id', (supplier as { id: string }).id);
    } else {
      const restaurantId = c.var.restaurantId;
      if (!restaurantId) return c.json({ error: 'Restaurant requis' }, 403);
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[messages] list error:', error);
      return c.json({ error: 'Erreur lors du chargement des messages' }, 500);
    }
    return c.json({ messages: data ?? [] });
  } catch (err) {
    console.error('[messages] GET error:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/marketplace/messages
 * Un restaurant envoie un message à un fournisseur.
 */
marketplaceMessagesRoutes.post('/', async (c) => {
  try {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    if (!restaurantId) return c.json({ error: 'Restaurant requis pour envoyer un message' }, 403);

    const body = await c.req.json<Record<string, unknown>>().catch(() => null);
    if (!body) return c.json({ error: 'Corps de requête invalide' }, 400);

    const supplierId = typeof body.supplier_id === 'string' ? body.supplier_id : '';
    const messageType = String(body.message_type ?? '');
    const text = typeof body.body === 'string' ? body.body.trim() : '';

    if (!supplierId) return c.json({ error: 'supplier_id requis' }, 400);
    if (!MESSAGE_TYPES.includes(messageType as (typeof MESSAGE_TYPES)[number]))
      return c.json({ error: 'Type de message invalide' }, 400);
    if (!text) return c.json({ error: 'Le message ne peut pas être vide' }, 400);

    // Le fournisseur cible doit exister et être actif
    const { data: supplier } = await supabase
      .from('suppliers').select('id').eq('id', supplierId).eq('is_active', true).maybeSingle();
    if (!supplier) return c.json({ error: 'Fournisseur introuvable' }, 404);

    const quantity = typeof body.quantity === 'number' ? body.quantity : null;

    const { data, error } = await supabase
      .from('supplier_messages')
      .insert({
        restaurant_id: restaurantId,
        supplier_id: supplierId,
        product_id: typeof body.product_id === 'string' ? body.product_id : null,
        message_type: messageType,
        subject: typeof body.subject === 'string' ? body.subject.trim() || null : null,
        body: text,
        quantity,
        unit: typeof body.unit === 'string' ? body.unit : null,
        requested_date: typeof body.requested_date === 'string' ? body.requested_date : null,
        status: 'unread',
      } as never)
      .select(SELECT)
      .single();

    if (error) {
      console.error('[messages] insert error:', error);
      return c.json({ error: "Erreur lors de l'envoi du message" }, 500);
    }
    return c.json({ message: data }, 201);
  } catch (err) {
    console.error('[messages] POST error:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PATCH /api/marketplace/messages/:id
 * Le fournisseur met à jour le statut (read / replied / archived) et/ou répond.
 * RLS garantit que seul le fournisseur propriétaire peut modifier la ligne.
 */
marketplaceMessagesRoutes.patch('/:id', async (c) => {
  try {
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    if (!userId) return c.json({ error: 'Non autorisé' }, 401);

    const id = c.req.param('id');
    const body = await c.req.json<Record<string, unknown>>().catch(() => null);
    if (!body) return c.json({ error: 'Corps de requête invalide' }, 400);

    const status = String(body.status ?? '');
    if (!PATCH_STATUSES.includes(status as (typeof PATCH_STATUSES)[number]))
      return c.json({ error: 'Statut invalide' }, 400);

    const updates: Record<string, unknown> = { status };
    if (status === 'replied') {
      const reply = typeof body.reply_body === 'string' ? body.reply_body.trim() : '';
      if (!reply) return c.json({ error: 'La réponse ne peut pas être vide' }, 400);
      updates.reply_body = reply;
      updates.replied_at = new Date().toISOString();
    }

    // RLS restreint déjà à supplier_id du compte ; .select renvoie null si non autorisé.
    const { data, error } = await supabase
      .from('supplier_messages')
      .update(updates as never)
      .eq('id', id)
      .select(SELECT)
      .maybeSingle();

    if (error) {
      console.error('[messages] update error:', error);
      return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
    }
    if (!data) return c.json({ error: 'Message introuvable' }, 404);
    return c.json({ message: data });
  } catch (err) {
    console.error('[messages] PATCH error:', err);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});
