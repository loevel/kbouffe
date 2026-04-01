/**
 * Orders routes — migrated from web-dashboard/src/app/api/orders/
 *
 * GET    /orders              — List orders (with filters)
 * GET    /orders/drafts       — List parked (draft) orders          [Park & Recall]
 * POST   /orders              — Create a new order
 * POST   /orders/draft        — Park a new draft order              [Park & Recall]
 * GET    /orders/:id          — Get single order
 * PATCH  /orders/:id          — Update order status
 * PATCH  /orders/:id/recall   — Convert draft → pending             [Park & Recall]
 * DELETE /orders/:id/draft    — Discard a parked order              [Park & Recall]
 * POST   /orders/:id/refund   — Refund an order
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";
import { getMobileMoneyProvider } from "./mobile-money-providers";

function getAdminClient(c: any) {
    return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export const ordersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /orders — List orders with filtering, sorting, pagination */
ordersRoutes.get("/", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;

    const status = c.req.query("status");
    const search = c.req.query("search");
    const sort = c.req.query("sort") ?? "newest";
    const payment = c.req.query("payment");
    const delivery = c.req.query("delivery");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(0, parseInt(c.req.query("limit") ?? "50", 10)));

    let query = supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("restaurant_id", restaurantId);

    if (status) query = query.eq("status", status);
    if (payment) query = query.eq("payment_status", payment);
    if (delivery) query = query.eq("delivery_type", delivery);
    if (search) {
        // Sanitize: strip PostgREST special chars to prevent query injection (CRIT-005)
        const safe = search.replace(/[%_(),.*!~]/g, "").slice(0, 100).trim();
        if (safe) {
            query = query.or(
                `customer_name.ilike.%${safe}%,id.ilike.%${safe}%`,
            );
        }
    }

    switch (sort) {
        case "oldest":
            query = query.order("created_at", { ascending: true });
            break;
        case "amount_desc":
            query = query.order("total", { ascending: false });
            break;
        case "amount_asc":
            query = query.order("total", { ascending: true });
            break;
        default:
            query = query.order("created_at", { ascending: false });
    }

    if (limit > 0) {
        query = query.range((page - 1) * limit, page * limit - 1);
    } else {
        query = query.limit(0);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error("Orders query error:", error);
        return c.json({ error: "Erreur lors de la récupération des commandes" }, 500);
    }

    return c.json({ orders: data ?? [], total: count ?? 0, page, limit });
});

/** POST /orders — Create a new order */
ordersRoutes.post("/", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const body = await c.req.json();

    // Génération numéro de facture unique — CGI camerounais Art.137-140
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const invoiceNumber = `CMD-${yyyymm}-${Date.now().toString(36).toUpperCase()}`;

    const orderData = {
        restaurant_id: restaurantId,
        customer_id: body.customer_id ?? null,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        items: body.items,
        subtotal: body.subtotal,
        delivery_fee: body.delivery_fee ?? 0,
        service_fee: body.service_fee ?? 0,
        corkage_fee: body.corkage_fee ?? 0,
        tip_amount: body.tip_amount ?? 0,
        total: body.total,
        status: "pending" as const,
        delivery_type: body.delivery_type ?? "delivery",
        delivery_address: body.delivery_address ?? null,
        payment_method: body.payment_method,
        payment_status: body.payment_status ?? "pending",
        notes: body.notes ?? null,
        table_number: body.table_number ?? null,
        table_id: body.table_id ?? null,
        covers: body.covers ?? null,
        external_drinks_count: body.external_drinks_count ?? 0,
        scheduled_for: body.scheduled_for ?? null,
        invoice_number: invoiceNumber,
        operator_member_id: body.operator_member_id ?? null,
    };

    const { data, error } = await supabase
        .from("orders")
        .insert(orderData as any)
        .select()
        .single();

    if (error) {
        console.error("Create order error:", error);
        return c.json({ error: "Erreur lors de la création de la commande" }, 500);
    }

    return c.json({ success: true, order: data }, 201);
});

// ─────────────────────────────────────────────────────────────────────────────
//  Park & Recall — draft orders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /orders/drafts — List all parked (draft) orders for the restaurant.
 * IMPORTANT: must be declared before GET /orders/:id to avoid param conflict.
 */
ordersRoutes.get("/drafts", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;

    const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, total, table_number, created_at, items")
        .eq("restaurant_id", restaurantId)
        .eq("status", "draft" as any)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Drafts query error:", error);
        return c.json({ error: "Erreur lors de la récupération des commandes garées" }, 500);
    }

    // Enrich with computed fields (draft_label, operator_member_id, items count)
    const drafts = (data ?? []).map((row: any) => ({
        id: row.id,
        draft_label: row.draft_label ?? null,
        operator_member_id: row.operator_member_id ?? null,
        customer_name: row.customer_name,
        table_number: row.table_number,
        total: row.total,
        items_count: Array.isArray(row.items) ? row.items.length : 0,
        created_at: row.created_at,
    }));

    return c.json({ drafts });
});

/**
 * POST /orders/draft — Park a new draft order.
 * IMPORTANT: must be declared before any /:id/* routes.
 */
ordersRoutes.post("/draft", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const body = await c.req.json();

    // ── Validation ────────────────────────────────────────────────────────────
    const { draftLabel, customerName, items, tableNumber, operatorMemberId, notes, covers, payment_method } = body;

    if (!draftLabel || typeof draftLabel !== "string" || !draftLabel.trim()) {
        return c.json({ error: "Un libellé de commande garée est requis (ex: Table 3)" }, 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
        return c.json({ error: "La commande doit contenir au moins un article" }, 400);
    }

    // Validate each item: must have id, quantity > 0, and a unit_price
    for (const item of items) {
        if (!item.id || typeof item.id !== "string") {
            return c.json({ error: "Chaque article doit avoir un identifiant valide" }, 400);
        }
        const qty = Number(item.quantity ?? item.qty ?? 0);
        if (!Number.isFinite(qty) || qty <= 0) {
            return c.json({ error: `Quantité invalide pour l'article ${item.id}` }, 400);
        }
        const price = Number(item.unit_price ?? item.price ?? 0);
        if (!Number.isFinite(price) || price < 0) {
            return c.json({ error: `Prix invalide pour l'article ${item.id}` }, 400);
        }
    }

    // ── Calculate totals ─────────────────────────────────────────────────────
    const subtotal = items.reduce((sum: number, item: any) => {
        const qty = Number(item.quantity ?? item.qty ?? 1);
        const price = Number(item.unit_price ?? item.price ?? 0);
        return sum + qty * price;
    }, 0);
    const total = subtotal; // no delivery fee for dine-in drafts

    // ── Invoice number ────────────────────────────────────────────────────────
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const invoiceNumber = `DRF-${yyyymm}-${Date.now().toString(36).toUpperCase()}`;

    // ── Insert draft order ────────────────────────────────────────────────────
    const orderData: Record<string, unknown> = {
        restaurant_id: restaurantId,
        customer_name: customerName ?? draftLabel,
        customer_phone: "",
        items,
        subtotal,
        delivery_fee: 0,
        service_fee: 0,
        corkage_fee: 0,
        tip_amount: 0,
        total,
        status: "draft",
        delivery_type: "dine_in",
        payment_method: payment_method ?? "cash",
        payment_status: "pending",
        notes: notes ?? null,
        table_number: tableNumber ?? null,
        covers: covers ?? null,
        draft_label: draftLabel.trim(),
        operator_member_id: operatorMemberId ?? null,
        invoice_number: invoiceNumber,
    };

    const { data, error } = await supabase
        .from("orders")
        .insert(orderData as any)
        .select("id, draft_label, total, items, table_number, created_at")
        .single();

    if (error) {
        console.error("Create draft order error:", error);
        return c.json({ error: "Erreur lors de la création de la commande garée" }, 500);
    }

    return c.json({ success: true, order: data }, 201);
});

// ─────────────────────────────────────────────────────────────────────────────

/** GET /orders/:id — Get a single order */
ordersRoutes.get("/:id", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const id = c.req.param("id");

    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .single();

    if (error || !data) {
        return c.json({ error: "Commande non trouvée" }, 404);
    }

    return c.json({ order: data });
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ["accepted", "cancelled"],
    accepted: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["out_for_delivery", "delivered", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

/** PATCH /orders/:id — Update order status / notes */
ordersRoutes.patch("/:id", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const id = c.req.param("id");
    const body = await c.req.json();

    // 1. Fetch current order to check state
    const { data: currentOrder, error: fetchError } = await supabase
        .from("orders")
        .select("status")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .single();

    if (fetchError || !currentOrder) return c.json({ error: "Commande introuvable" }, 404);

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) {
        const currentStatus = currentOrder.status as string;
        const nextStatus = body.status as string;
        
        if (currentStatus !== nextStatus) {
            const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
            if (!allowed.includes(nextStatus)) {
                return c.json({ error: `Transition de statut invalide: ${currentStatus} -> ${nextStatus}` }, 400);
            }
            updateData.status = nextStatus;
        }
    }
    if (body.payment_status !== undefined) {
        // SEC-010: payment_status can only be set to "paid" via webhook — merchants cannot set it
        const MERCHANT_ALLOWED_PAYMENT_TRANSITIONS: Record<string, string[]> = {
            pending:           ["cancelled"],   // merchant can cancel unpaid orders
            paid:              ["refund_requested"], // merchant can initiate refund
            refund_requested:  [],
            refunded:          [],
            failed:            [],
            cancelled:         [],
        };
        const currentPStatus = (currentOrder as any).payment_status as string ?? "pending";
        const nextPStatus = body.payment_status as string;
        const allowedNext = MERCHANT_ALLOWED_PAYMENT_TRANSITIONS[currentPStatus] ?? [];
        if (!allowedNext.includes(nextPStatus)) {
            return c.json({ error: `Transition de statut de paiement invalide : ${currentPStatus} → ${nextPStatus}` }, 400);
        }
        updateData.payment_status = nextPStatus;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.driver_id !== undefined) {
        if (body.driver_id === null || body.driver_id === "") {
            updateData.driver_id = null;
        } else {
            const driverId = String(body.driver_id);
            const adminDb = getAdminClient(c);
            const { data: driverMember, error: driverError } = await adminDb
                .from("restaurant_members")
                .select("user_id")
                .eq("restaurant_id", restaurantId)
                .eq("user_id", driverId)
                .eq("role", "driver")
                .eq("status", "active")
                .maybeSingle();

            if (driverError || !driverMember) {
                return c.json({ error: "Livreur invalide ou inactif pour ce restaurant" }, 400);
            }

            updateData.driver_id = driverId;
        }
    }

    if (body.preparation_time_minutes !== undefined) {
        const mins = Number(body.preparation_time_minutes);
        if (!Number.isFinite(mins) || !Number.isInteger(mins) || mins <= 0 || mins > 600) {
            return c.json({ error: "Durée de préparation invalide (1-600 min)" }, 400);
        }
        updateData.preparation_time_minutes = mins;
    }

    if (body.status === "accepted" && updateData.preparation_time_minutes === undefined) {
        return c.json({ error: "La durée de préparation est requise pour accepter la commande" }, 400);
    }

    if (body.status === "delivered") {
        updateData.delivered_at = new Date().toISOString();
        if (body.delivery_note) updateData.delivery_note = String(body.delivery_note).slice(0, 500);
        if (body.delivered_by) updateData.delivered_by = String(body.delivered_by).slice(0, 100);
    }

    if (body.scheduled_for !== undefined) {
        if (body.scheduled_for !== null) {
            const d = new Date(body.scheduled_for);
            if (isNaN(d.getTime())) return c.json({ error: "Date de programmation invalide" }, 400);
            updateData.scheduled_for = d.toISOString();
        } else {
            updateData.scheduled_for = null;
        }
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("orders")
        .update(updateData as any)
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .select()
        .single();

    if (error) {
        console.error("Update order error:", error);
        return c.json({ error: "Erreur lors de la mise à jour" }, 500);
    }

    return c.json({ success: true, order: data });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Park & Recall — recall / discard routes (must come before generic /:id/refund)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /orders/:id/recall — Convert a draft order into a real pending order.
 * Requires paymentMethod in the body.
 */
ordersRoutes.patch("/:id/recall", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const id = c.req.param("id");
    const body = await c.req.json();

    // 1. Fetch the draft
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("id, status, total")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .single();

    if (fetchError || !order) {
        return c.json({ error: "Commande non trouvée" }, 404);
    }

    if ((order as any).status !== "draft") {
        return c.json({ error: "Seules les commandes garées peuvent être rappelées" }, 400);
    }

    if (!body.paymentMethod || typeof body.paymentMethod !== "string") {
        return c.json({ error: "Le mode de paiement est requis pour finaliser la commande" }, 400);
    }

    // 2. Update: draft → pending
    const { data: updated, error: updateError } = await supabase
        .from("orders")
        .update({
            status: "pending" as any,
            payment_method: body.paymentMethod as any,
            draft_label: null,
            updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .select("id, status, total, payment_method")
        .single();

    if (updateError) {
        console.error("Recall order error:", updateError);
        return c.json({ error: "Erreur lors du rappel de la commande" }, 500);
    }

    return c.json({ success: true, order: updated });
});

/**
 * DELETE /orders/:id/draft — Discard a parked order (set status to cancelled).
 * Keeps an audit trail rather than hard-deleting.
 */
ordersRoutes.delete("/:id/draft", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const id = c.req.param("id");

    // 1. Verify the order exists and is a draft
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .single();

    if (fetchError || !order) {
        return c.json({ error: "Commande non trouvée" }, 404);
    }

    if ((order as any).status !== "draft") {
        return c.json({ error: "Seules les commandes garées peuvent être supprimées via cette route" }, 400);
    }

    // 2. Mark as cancelled (audit trail preserved)
    const { error: updateError } = await supabase
        .from("orders")
        .update({
            status: "cancelled" as any,
            draft_label: null,
            updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .eq("restaurant_id", restaurantId);

    if (updateError) {
        console.error("Discard draft error:", updateError);
        return c.json({ error: "Erreur lors de la suppression de la commande garée" }, 500);
    }

    return c.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────

/** POST /orders/:id/refund — Refund an order (Loi 2015/003 Art.33 — restitution effective) */
ordersRoutes.post("/:id/refund", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const id = c.req.param("id");

    // 1. Fetch order
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("id, restaurant_id, payment_status, total, payment_method")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .single();

    if (fetchError || !order) {
        return c.json({ error: "Commande non trouvée" }, 404);
    }

    // 2. Only paid orders can be refunded
    if (order.payment_status !== "paid") {
        return c.json({ error: "Seules les commandes payées peuvent être remboursées" }, 400);
    }

    const admin = getAdminClient(c);

    // 3. Fetch the original payment transaction to get payer MSISDN
    const { data: txn } = await admin
        .from("payment_transactions")
        .select("id, payer_msisdn, amount, provider")
        .eq("order_id", id)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    // 4. Attempt real MoMo disbursement (Loi 2015/003 Art.33)
    let refundReferenceId: string | null = null;
    let refundError: string | null = null;

    if (txn && txn.payer_msisdn && txn.amount > 0 && (order as any).payment_method !== "cash") {
        const providerCode = (txn.provider ?? "mtn_momo") as any;
        const provider = getMobileMoneyProvider(providerCode);

        if (provider?.transfer && provider.isConfigured(c.env)) {
            refundReferenceId = crypto.randomUUID();
            try {
                await provider.transfer(c.env, {
                    referenceId: refundReferenceId,
                    amount: txn.amount,
                    currency: "XAF",
                    externalId: `refund-${id}`,
                    payeeMsisdn: txn.payer_msisdn,
                    payerMessage: "Remboursement commande KBouffe",
                    payeeNote: `Remboursement commande #${id.slice(0, 8)}`,
                });
                // Record the refund transaction
                await admin.from("payment_transactions").insert({
                    id: crypto.randomUUID(),
                    order_id: id,
                    restaurant_id: restaurantId,
                    amount: txn.amount,
                    currency: "XAF",
                    status: "pending",
                    provider: providerCode,
                    provider_status: "PENDING",
                    payer_msisdn: txn.payer_msisdn,
                    reference_id: refundReferenceId,
                    type: "refund",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                } as never);
            } catch (err) {
                refundError = err instanceof Error ? err.message : "Erreur disbursement MoMo";
                console.error("Refund disbursement failed:", refundError);
                // Block the refund — do not mark as refunded without actual money movement
                return c.json({
                    error: `Impossible d'envoyer le remboursement MoMo : ${refundError}. Contactez le support.`,
                }, 502);
            }
        } else {
            // Provider not configured — flag but allow manual refund path
            refundError = "Provider MoMo non configuré — remboursement manuel requis";
        }
    }

    // 5. Update order status (only reached after successful disbursement or cash order)
    const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
            payment_status: "refunded",
            status: "cancelled",
            updated_at: new Date().toISOString(),
            notes: (order as any).notes
                ? `${(order as any).notes}\n[Remboursement] ${new Date().toLocaleString()}${refundReferenceId ? ` — ref: ${refundReferenceId}` : " — espèces"}`
                : `[Remboursement] ${new Date().toLocaleString()}${refundReferenceId ? ` — ref: ${refundReferenceId}` : " — espèces"}`,
        } as any)
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .select()
        .single();

    if (updateError) {
        return c.json({ error: "Erreur lors de la mise à jour de la commande" }, 500);
    }

    return c.json({
        success: true,
        order: updatedOrder,
        refund: {
            method: refundReferenceId ? "momo_disbursement" : "cash_or_manual",
            referenceId: refundReferenceId,
            warning: refundError ?? undefined,
        },
    });
});
