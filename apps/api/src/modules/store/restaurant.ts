/**
 * Restaurant routes — migrated from web-dashboard/src/app/api/restaurant/
 *
 * GET   /restaurant   — Get authenticated merchant's restaurant
 * PATCH /restaurant   — Update restaurant info
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const restaurantRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /restaurant — Get the merchant's restaurant */
restaurantRoutes.get("/", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

    if (error || !data) {
        return c.json({ error: "Restaurant not found" }, 404);
    }

    return c.json(data);
});

/** PATCH /restaurant — Update restaurant info */
restaurantRoutes.patch("/", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const body = await c.req.json();

    const { data, error } = await supabase
        .from("restaurants")
        .update(body)
        .eq("id", restaurantId)
        .select()
        .single();

    if (error || !data) {
        return c.json({ error: "Failed to update restaurant" }, 500);
    }

    return c.json(data);
});

/** GET /restaurant/activity — Activity feed (orders + reviews + messages) */
restaurantRoutes.get("/activity", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const days7Ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, reviewsRes, messagesRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id, status, customer_name, total, created_at")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", days7Ago)
            .order("created_at", { ascending: false })
            .limit(10),
        supabase
            .from("reviews")
            .select("id, rating, comment, created_at, user_id")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", days7Ago)
            .order("created_at", { ascending: false })
            .limit(10),
        supabase
            .from("messages")
            .select("id, content, created_at, sender_id")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", days7Ago)
            .order("created_at", { ascending: false })
            .limit(10),
    ]);

    type Event = { type: string; id: string; title: string; subtitle?: string; timestamp: string };
    const events: Event[] = [];

    for (const o of ordersRes.data ?? []) {
        events.push({
            type: "order_new",
            id: o.id as string,
            title: `Commande #${(o.id as string).slice(-6).toUpperCase()}`,
            subtitle: `${o.customer_name ?? "Client"} — ${(o.total as number)?.toLocaleString("fr-FR")} FCFA`,
            timestamp: o.created_at as string,
        });
    }
    for (const r of reviewsRes.data ?? []) {
        events.push({
            type: "review_new",
            id: r.id as string,
            title: `Nouvel avis (${r.rating as number}★)`,
            subtitle: r.comment as string | undefined,
            timestamp: r.created_at as string,
        });
    }
    for (const m of messagesRes.data ?? []) {
        events.push({
            type: "message_new",
            id: m.id as string,
            title: "Nouveau message",
            subtitle: m.content as string | undefined,
            timestamp: m.created_at as string,
        });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ events: events.slice(0, 15) });
});

/** GET /restaurant/badges — Count of pending orders, unread messages, reviews needing reply */
restaurantRoutes.get("/badges", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const [ordersRes, msgsRes, reviewsRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id", { count: "exact" })
            .eq("restaurant_id", restaurantId)
            .in("status", ["pending", "confirmed"]),
        supabase
            .from("messages")
            .select("id", { count: "exact" })
            .in("is_read", [false])
            .neq("sender_id", c.var.userId),
        supabase
            .from("reviews")
            .select("id", { count: "exact" })
            .eq("restaurant_id", restaurantId)
            .is("reply", null),
    ]);

    return c.json({
        orders: ordersRes.count ?? 0,
        messages: msgsRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
    });
});

/** GET /restaurant/search?q=... — Global quick search across orders, products, customers */
restaurantRoutes.get("/search", async (c) => {
    const restaurantId = c.var.restaurantId;
    const q = (c.req.query("q") ?? "").trim();
    const supabase = c.var.supabase;

    if (q.length < 2) return c.json({ results: [] });

    const [ordersRes, productsRes, customersRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id, status, total, customer_name, created_at")
            .eq("restaurant_id", restaurantId)
            .or(`id.ilike.%${q}%,customer_name.ilike.%${q}%`)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("products")
            .select("id, name, price, category_id")
            .eq("restaurant_id", restaurantId)
            .ilike("name", `%${q}%`)
            .limit(5),
        supabase
            .from("users")
            .select("id, full_name, phone, email")
            .ilike("full_name", `%${q}%`)
            .limit(3),
    ]);

    type SearchResult = { type: "order" | "product" | "customer"; id: string; title: string; subtitle?: string; href: string };
    const results: SearchResult[] = [];

    for (const o of ordersRes.data ?? []) {
        const shortId = (o.id as string).slice(-6).toUpperCase();
        results.push({
            type: "order",
            id: o.id as string,
            title: `Commande #${shortId}`,
            subtitle: `${o.customer_name ?? "Client"} — ${(o.total as number)?.toLocaleString("fr-FR")} FCFA`,
            href: `/dashboard/orders`,
        });
    }
    for (const p of productsRes.data ?? []) {
        results.push({
            type: "product",
            id: p.id as string,
            title: p.name as string,
            subtitle: `${(p.price as number)?.toLocaleString("fr-FR")} FCFA`,
            href: `/dashboard/menu`,
        });
    }
    for (const u of customersRes.data ?? []) {
        results.push({
            type: "customer",
            id: u.id as string,
            title: u.full_name as string,
            subtitle: (u.phone ?? u.email) as string | undefined,
            href: `/dashboard/customers`,
        });
    }

    return c.json({ results: results.slice(0, 10) });
});
