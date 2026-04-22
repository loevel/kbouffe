import { Hono } from "hono";
import { requireDomain } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminSubscriptionsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();


// ── GET /admin/subscriptions/stats ──────────────────────────────────────────
adminSubscriptionsRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const supabase = c.var.supabase;
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

    const [
        { data: active },
        { data: renewingThisMonth },
        { data: churned },
        { data: allPurchases },
    ] = await Promise.all([
        // Active subs
        supabase.from("marketplace_purchases")
            .select("amount_paid, restaurant_id, service_id, starts_at, expires_at")
            .eq("status", "active")
            .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`),
        // Renewals this month: expires between now and end of month
        supabase.from("marketplace_purchases")
            .select("id, restaurant_id, service_id, amount_paid, expires_at")
            .eq("status", "active")
            .gte("expires_at", now.toISOString())
            .lt("expires_at", nextMonthStart),
        // Churned this month: became inactive or expired this month
        supabase.from("marketplace_purchases")
            .select("id, restaurant_id, service_id, amount_paid, expires_at, status")
            .or("status.eq.cancelled,status.eq.expired")
            .gte("expires_at", monthStart)
            .lt("expires_at", nextMonthStart),
        // All purchases for MRR by month
        supabase.from("marketplace_purchases")
            .select("amount_paid, starts_at, status")
            .order("starts_at", { ascending: true }),
    ]);

    // MRR = sum of active subscriptions
    const mrr = (active ?? []).reduce((s: number, p: any) => s + (p.amount_paid ?? 0), 0);

    // MRR by month (last 12 months) — group by month of starts_at for active
    const mrrByMonth: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCMonth(d.getUTCMonth() - i);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        mrrByMonth[key] = 0;
    }
    for (const p of allPurchases ?? []) {
        if (!p.starts_at) continue;
        const key = p.starts_at.slice(0, 7); // "YYYY-MM"
        if (key in mrrByMonth) {
            mrrByMonth[key] = (mrrByMonth[key] ?? 0) + (p.amount_paid ?? 0);
        }
    }
    const mrrChart = Object.entries(mrrByMonth).map(([month, revenue]) => ({ month, revenue }));

    return c.json({
        mrr,
        activeCount: (active ?? []).length,
        renewingCount: (renewingThisMonth ?? []).length,
        renewingAmount: (renewingThisMonth ?? []).reduce((s: number, p: any) => s + (p.amount_paid ?? 0), 0),
        churnCount: (churned ?? []).length,
        churnAmount: (churned ?? []).reduce((s: number, p: any) => s + (p.amount_paid ?? 0), 0),
        mrrChart,
    });
});

// ── GET /admin/subscriptions — paginated list ────────────────────────────────
adminSubscriptionsRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const supabase = c.var.supabase;
    const statusFilter = c.req.query("status") ?? "active";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, parseInt(c.req.query("limit") ?? "25"));
    const now = new Date().toISOString();

    let query = supabase
        .from("marketplace_purchases")
        .select(`
            id, status, amount_paid, starts_at, expires_at, notes, created_at,
            service:service_id ( id, name, slug, category, price ),
            restaurant:restaurant_id ( id, name, slug, email, phone, logo_url )
        `, { count: "exact" });

    if (statusFilter === "active") {
        query = query.eq("status", "active").or(`expires_at.is.null,expires_at.gt.${now}`);
    } else if (statusFilter === "expired") {
        query = query.lt("expires_at", now);
    } else if (statusFilter === "cancelled") {
        query = query.eq("status", "cancelled");
    }
    // else "all"

    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (error) return c.json({ error: error.message }, 500);

    const formatted = (data ?? []).map((p: any) => {
        const svc = Array.isArray(p.service) ? p.service[0] : p.service;
        const rest = Array.isArray(p.restaurant) ? p.restaurant[0] : p.restaurant;
        const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
        return {
            id: p.id,
            status: isExpired ? "expired" : p.status,
            amountPaid: p.amount_paid,
            startsAt: p.starts_at,
            expiresAt: p.expires_at,
            notes: p.notes,
            createdAt: p.created_at,
            service: svc ? { id: svc.id, name: svc.name, slug: svc.slug, category: svc.category, price: svc.price } : null,
            restaurant: rest ? { id: rest.id, name: rest.name, slug: rest.slug, email: rest.email, phone: rest.phone, logoUrl: rest.logo_url } : null,
        };
    });

    return c.json({
        data: formatted,
        pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    });
});
