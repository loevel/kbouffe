import { Hono } from "hono";
import { z } from "zod";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminOrdersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const OrderStatusSchema = z.object({
    status: z.enum(["scheduled", "pending", "accepted", "preparing", "ready", "completed", "cancelled"]),
    reason: z.string().trim().max(300).optional(),
});

const OrderRefundSchema = z.object({
    amount: z.number().int().positive(),
    reason: z.string().trim().min(3).max(300),
    type: z.enum(["full", "partial"]),
});

function buildRefundEvidence(input: {
    amount: number;
    reason: string;
    type: "full" | "partial";
    actorId?: string | null;
    originalPaymentReference?: string | null;
    providerReference: string;
}) {
    return {
        amount: input.amount,
        reason: input.reason,
        type: input.type,
        actor_id: input.actorId ?? null,
        original_payment_reference: input.originalPaymentReference ?? null,
        provider_reference: input.providerReference,
    };
}

adminOrdersRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "orders:read");
    if (denied) return denied;

    const q = c.req.query("q") ?? "";
    const statusFilter = c.req.query("status") ?? "all";
    const restaurantId = c.req.query("restaurant_id") ?? "";
    const paymentStatus = c.req.query("payment_status") ?? "all";
    const dateFrom = c.req.query("date_from") ?? "";
    const dateTo = c.req.query("date_to") ?? "";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    const supabase = c.var.supabase;
    
    let query = supabase
        .from("orders")
        .select(`
            id,
            restaurant_id,
            customer_name,
            customer_phone,
            total,
            status,
            delivery_type,
            payment_status,
            payment_method,
            created_at,
            updated_at,
            restaurant:restaurants(name),
            items:order_items(id)
        `, { count: "exact" });

    if (q) {
        const orClauses = [
            `customer_name.ilike.%${q}%`,
            `customer_phone.ilike.%${q}%`,
            `id.ilike.%${q}%`,
        ];

        const { data: restaurantsByName } = await supabase
            .from("restaurants")
            .select("id")
            .ilike("name", `%${q}%`)
            .limit(100);

        const matchingRestaurantIds = (restaurantsByName ?? [])
            .map((row: { id: string | null }) => row.id)
            .filter((id): id is string => Boolean(id));

        if (matchingRestaurantIds.length > 0) {
            const inList = matchingRestaurantIds.map((id) => `"${id}"`).join(",");
            orClauses.push(`restaurant_id.in.(${inList})`);
        }

        query = query.or(orClauses.join(","));
    }

    if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
    }
    if (restaurantId) {
        query = query.eq("restaurant_id", restaurantId);
    }
    if (paymentStatus !== "all") {
        query = query.eq("payment_status", paymentStatus);
    }
    if (dateFrom) {
        query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
        query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
    }

    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: orders, count, error } = await query;

    if (error) {
        return c.json({ error: error.message }, 500);
    }

    return c.json({
        data: (orders || []).map((o: any) => ({
            id: o.id,
            restaurantId: o.restaurant_id,
            restaurantName: o.restaurant?.name || "Inconnu",
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            total: o.total,
            status: o.status,
            deliveryType: o.delivery_type,
            paymentStatus: o.payment_status,
            paymentMethod: o.payment_method,
            itemCount: Array.isArray(o.items) ? o.items.length : 0,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
        })),
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / limit)
        }
    });
});

adminOrdersRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "orders:read");
    if (denied) return denied;

    const supabase = c.var.supabase;
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const { data: todayOrders, error } = await supabase
        .from("orders")
        .select("id, total, status, payment_status, created_at")
        .gte("created_at", dayStart.toISOString());

    if (error) {
        return c.json({ error: "Erreur lors de la récupération des statistiques commandes" }, 500);
    }

    const rows = (todayOrders ?? []) as Array<{
        total: number | null;
        status: string | null;
        payment_status: string | null;
    }>;

    return c.json({
        totalToday: rows.length,
        totalRevenueToday: rows.reduce((sum, row) => sum + (row.total ?? 0), 0),
        pendingCount: rows.filter((row) => row.status === "pending").length,
        disputedCount: rows.filter((row) => row.payment_status === "failed").length,
        refundedToday: rows.filter((row) => row.payment_status === "refunded").length,
    });
});

adminOrdersRoutes.get("/:id", async (c) => {
    const denied = requireDomain(c, "orders:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;

    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            *,
            restaurant:restaurants(id, name, logo_url),
            items:order_items(*),
            paymentTransactions:payment_transactions(
                id,
                provider,
                reference_id,
                external_id,
                amount,
                currency,
                status,
                provider_status,
                requested_at,
                completed_at,
                failed_reason
            )
        `)
        .eq("id", id)
        .maybeSingle();

    if (error || !order) {
        return c.json({ error: "Commande introuvable" }, 404);
    }

    // Format for frontend
    const formattedOrder = {
        id: order.id,
        restaurant: {
            id: order.restaurant?.id,
            name: order.restaurant?.name,
            logoUrl: order.restaurant?.logo_url
        },
        customer: {
            name: order.customer_name,
            phone: order.customer_phone,
            address: order.delivery_address
        },
        items: (order.items || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            notes: i.notes
        })),
        pricing: {
            subtotal: order.subtotal,
            deliveryFee: order.delivery_fee,
            serviceFee: order.service_fee,
            tip: order.tip_amount,
            total: order.total
        },
        status: order.status,
        paymentStatus: order.payment_status,
        deliveryType: order.delivery_type,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        notes: order.notes,
        paymentTransaction: Array.isArray(order.paymentTransactions) ? order.paymentTransactions[0] ?? null : order.paymentTransactions ?? null,
    };

    return c.json(formattedOrder);
});

adminOrdersRoutes.post("/:id/refund", async (c) => {
    const denied = requireDomain(c, "orders:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = OrderRefundSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const supabase = c.var.supabase;
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, restaurant_id, total, status, payment_status, payment_method, paymentTransactions:payment_transactions(id, reference_id, external_id, provider)")
        .eq("id", id)
        .maybeSingle();

    if (orderError || !order) {
        return c.json({ error: "Commande introuvable" }, 404);
    }

    if (parsed.data.amount > (order.total ?? 0)) {
        return c.json({ error: "Le montant du remboursement dépasse le total de la commande" }, 400);
    }

    const orderUpdates: Record<string, unknown> = {
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
    };

    if (parsed.data.type === "full" && order.status !== "completed") {
        orderUpdates.status = "cancelled";
    }

    const { error: updateError } = await supabase
        .from("orders")
        .update(orderUpdates)
        .eq("id", id);

    if (updateError) {
        return c.json({ error: "Impossible de mettre à jour la commande" }, 500);
    }

    const latestPaymentTx = Array.isArray((order as any).paymentTransactions)
        ? (order as any).paymentTransactions[0] ?? null
        : (order as any).paymentTransactions ?? null;
    const refundReference = crypto.randomUUID();

    const { error: refundEventError } = await supabase
        .from("refund_events")
        .insert({
            restaurant_id: order.restaurant_id,
            order_id: id,
            payment_transaction_id: latestPaymentTx?.id ?? null,
            amount: parsed.data.amount,
            refund_type: parsed.data.type,
            reason: parsed.data.reason,
            provider_name: order.payment_method === "cash" ? "cash" : "mtn_momo",
            provider_reference: refundReference,
            original_reference_id: latestPaymentTx?.reference_id ?? latestPaymentTx?.external_id ?? null,
            evidence: buildRefundEvidence({
                amount: parsed.data.amount,
                reason: parsed.data.reason,
                type: parsed.data.type,
                actorId: c.get("userId"),
                originalPaymentReference: latestPaymentTx?.reference_id ?? latestPaymentTx?.external_id ?? null,
                providerReference: refundReference,
            }),
            recorded_by: c.get("userId"),
        } as never);

    if (refundEventError) {
        return c.json({ error: "La commande a été remboursée mais la preuve de remboursement n'a pas pu être enregistrée" }, 500);
    }

    if (order.payment_method && order.payment_method !== "cash") {
        const { error: txError } = await supabase
            .from("payment_transactions")
            .insert({
                restaurant_id: order.restaurant_id,
                order_id: order.id,
                provider: "mtn_momo",
                reference_id: refundReference,
                amount: parsed.data.amount,
                currency: "XAF",
                status: "refunded",
                provider_status: "manual_refund",
                provider_response: {
                    reason: parsed.data.reason,
                    type: parsed.data.type,
                    admin_id: c.get("userId"),
                    refund_reference: refundReference,
                    original_payment_reference: latestPaymentTx?.reference_id ?? latestPaymentTx?.external_id ?? null,
                },
                completed_at: new Date().toISOString(),
            } as never);

        if (txError) {
            return c.json({ error: "Commande mise à jour, mais la trace de remboursement a échoué" }, 500);
        }
    }

    await logAdminAction(c, {
        action: "refund_order",
        targetType: "order",
        targetId: id,
        details: {
            amount: parsed.data.amount,
            reason: parsed.data.reason,
            type: parsed.data.type,
            refundReference,
        },
    });

    return c.json({ success: true, paymentStatus: "refunded" });
});

adminOrdersRoutes.get("/:id/refunds", async (c) => {
    const denied = requireDomain(c, "orders:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("refund_events")
        .select("id, restaurant_id, order_id, payment_transaction_id, amount, refund_type, reason, provider_name, provider_reference, original_reference_id, evidence, recorded_by, recorded_at, created_at")
        .eq("order_id", id)
        .order("recorded_at", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ success: true, refunds: data ?? [] });
});

adminOrdersRoutes.patch("/:id/status", async (c) => {
    const denied = requireDomain(c, "orders:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = OrderStatusSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const { status, reason } = parsed.data;

    const supabase = c.var.supabase;

    const { data: updated, error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "update_order_status",
        targetType: "order",
        targetId: id,
        details: { status, reason: reason ?? null }
    });

    return c.json({ success: true, status: updated.status });
});
