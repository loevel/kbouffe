import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminOrdersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminOrdersRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "orders:read");
    if (denied) return denied;

    const q = c.req.query("q") ?? "";
    const statusFilter = c.req.query("status") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    
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
            created_at,
            restaurant:restaurants(name)
        `, { count: "exact" });

    if (q) {
        const orClauses = [
            `customer_name.ilike.%${q}%`,
            `customer_phone.ilike.%${q}%`,
            `id.ilike.%${q}%`,
            `restaurants.name.ilike.%${q}%`
        ];
        query = query.or(orClauses.join(','));
    }

    if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
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
            createdAt: o.created_at
        })),
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / limit)
        }
    });
});

adminOrdersRoutes.get("/:id", async (c) => {
    const denied = requireDomain(c, "orders:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            *,
            restaurant:restaurants(id, name, logo_url),
            items:order_items(*)
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
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        notes: order.notes
    };

    return c.json(formattedOrder);
});

adminOrdersRoutes.patch("/:id/status", async (c) => {
    const denied = requireDomain(c, "orders:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json();
    const { status } = body;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

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
        details: { status }
    });

    return c.json({ success: true, status: updated.status });
});
