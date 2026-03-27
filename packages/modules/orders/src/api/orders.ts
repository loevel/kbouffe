/**
 * Orders routes — migrated from web-dashboard/src/app/api/orders/
 *
 * GET  /orders          — List orders (with filters)
 * POST /orders          — Create a new order
 * GET  /orders/:id      — Get single order
 * PATCH /orders/:id     — Update order status
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

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
        query = query.or(
            `customer_name.ilike.%${search}%,id.ilike.%${search}%`,
        );
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
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;
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

/** POST /orders/:id/refund — Refund an order */
ordersRoutes.post("/:id/refund", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const id = c.req.param("id");

    // 1. Fetch order to verify ownership and current status
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("id, restaurant_id, payment_status, total, payment_method")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .single();

    if (fetchError || !order) {
        return c.json({ error: "Commande non trouvée" }, 404);
    }

    // 2. Constraints: Only paid orders can be refunded
    if (order.payment_status !== "paid") {
        return c.json({ error: "Seules les commandes payées peuvent être remboursées" }, 400);
    }

    // 3. Logic: Update payment_status to 'refunded'
    // Note: For now, we manually track the refund. 
    // Automated MoMo/Stripe refund logic would be added here in the future.
    const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({ 
            payment_status: "refunded",
            status: "cancelled", // Automatically cancel order if refunded
            updated_at: new Date().toISOString(),
            notes: (order as any).notes 
                ? `${(order as any).notes}\n[Refund] Remboursement effectué le ${new Date().toLocaleString()}`
                : `[Refund] Remboursement effectué le ${new Date().toLocaleString()}`
        } as any)
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .select()
        .single();

    if (updateError) {
        console.error("Refund order error:", updateError);
        return c.json({ error: "Erreur lors du remboursement" }, 500);
    }

    // 4. Log the refund transaction if needed (future work)

    return c.json({ success: true, order: updatedOrder });
});
