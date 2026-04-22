import { Hono } from "hono";
import { requireDomain } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminSocialMonitorRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();


const PLATFORM_META: Record<string, { label: string; color: string }> = {
    facebook:  { label: "Facebook",  color: "#1877F2" },
    instagram: { label: "Instagram", color: "#E1306C" },
    telegram:  { label: "Telegram",  color: "#229ED9" },
    tiktok:    { label: "TikTok",    color: "#000000" },
    whatsapp:  { label: "WhatsApp",  color: "#25D366" },
};

// ── GET /admin/social-monitor/stats ──────────────────────────────────────────
adminSocialMonitorRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = c.var.supabase;
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [
        { data: allPosts },
        { data: accountsData },
        { data: monthPosts },
    ] = await Promise.all([
        supabase
            .from("social_posts")
            .select("id, platform, status, restaurant_id, created_at, published_at"),
        supabase
            .from("social_accounts")
            .select("platform, is_connected, restaurant_id"),
        supabase
            .from("social_posts")
            .select("id, platform, status, restaurant_id")
            .gte("created_at", monthStart),
    ]);

    const posts = allPosts ?? [];
    const accounts = accountsData ?? [];

    // By status
    const byStatus: Record<string, number> = {};
    for (const p of posts) {
        byStatus[(p as any).status] = (byStatus[(p as any).status] ?? 0) + 1;
    }

    // By platform
    const byPlatform: Record<string, { total: number; published: number }> = {};
    for (const p of posts) {
        const pl = (p as any).platform as string;
        if (!byPlatform[pl]) byPlatform[pl] = { total: 0, published: 0 };
        byPlatform[pl].total++;
        if ((p as any).status === "published") byPlatform[pl].published++;
    }

    const platformStats = Object.entries(byPlatform).map(([platform, s]) => ({
        platform,
        label: PLATFORM_META[platform]?.label ?? platform,
        color: PLATFORM_META[platform]?.color ?? "#888",
        total: s.total,
        published: s.published,
        publishRate: s.total > 0 ? Math.round((s.published / s.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // Connected accounts per platform
    const connectedAccounts: Record<string, number> = {};
    const totalConnected = accounts.filter((a: any) => a.is_connected).length;
    for (const a of accounts) {
        if ((a as any).is_connected) {
            const pl = (a as any).platform as string;
            connectedAccounts[pl] = (connectedAccounts[pl] ?? 0) + 1;
        }
    }

    // Top restaurants by post count
    const restaurantCounts = new Map<string, number>();
    for (const p of posts) {
        const rid = (p as any).restaurant_id as string;
        restaurantCounts.set(rid, (restaurantCounts.get(rid) ?? 0) + 1);
    }
    const topRestaurantIds = [...restaurantCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

    let topRestaurants: any[] = [];
    if (topRestaurantIds.length > 0) {
        const { data: rests } = await supabase
            .from("restaurants")
            .select("id, name, slug, logo_url")
            .in("id", topRestaurantIds);
        topRestaurants = (rests ?? []).map((r: any) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            logoUrl: r.logo_url,
            postCount: restaurantCounts.get(r.id) ?? 0,
        })).sort((a, b) => b.postCount - a.postCount);
    }

    const total = posts.length;
    const published = byStatus["published"] ?? 0;
    const failed = byStatus["failed"] ?? 0;
    const draft = byStatus["draft"] ?? 0;
    const scheduled = byStatus["scheduled"] ?? 0;
    const publishRate = total > 0 ? Math.round((published / total) * 100) : 0;

    // Trend: last 7 days of published posts
    const trend: { date: string; published: number; failed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayPosts = posts.filter((p: any) => (p.created_at as string).startsWith(dateStr));
        trend.push({
            date: dateStr,
            published: dayPosts.filter((p: any) => p.status === "published").length,
            failed: dayPosts.filter((p: any) => p.status === "failed").length,
        });
    }

    return c.json({
        summary: {
            total,
            published,
            failed,
            draft,
            scheduled,
            publishRate,
            thisMonth: (monthPosts ?? []).length,
            connectedAccounts: totalConnected,
        },
        byStatus,
        platformStats,
        connectedAccounts,
        topRestaurants,
        trend,
    });
});

// ── GET /admin/social-monitor — paginated posts ───────────────────────────────
adminSocialMonitorRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "stats");
    if (denied) return denied;

    const supabase = c.var.supabase;
    const platform = c.req.query("platform") ?? "";
    const status = c.req.query("status") ?? "";
    const search = c.req.query("search") ?? "";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(50, parseInt(c.req.query("limit") ?? "25"));

    let query = supabase
        .from("social_posts")
        .select(`
            id, platform, content, image_url, status,
            scheduled_at, published_at, error_message, created_at,
            restaurant:restaurant_id ( id, name, slug, logo_url )
        `, { count: "exact" });

    if (platform) query = query.eq("platform", platform);
    if (status)   query = query.eq("status", status);

    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (error) return c.json({ error: error.message }, 500);

    const formatted = (data ?? []).map((p: any) => {
        const rest = Array.isArray(p.restaurant) ? p.restaurant[0] : p.restaurant;
        return {
            id: p.id,
            platform: p.platform,
            platformLabel: PLATFORM_META[p.platform]?.label ?? p.platform,
            content: (p.content as string).slice(0, 120),
            imageUrl: p.image_url,
            status: p.status,
            scheduledAt: p.scheduled_at,
            publishedAt: p.published_at,
            errorMessage: p.error_message,
            createdAt: p.created_at,
            restaurant: rest
                ? { id: rest.id, name: rest.name, slug: rest.slug, logoUrl: rest.logo_url }
                : null,
        };
    });

    // Filter by restaurant name client-side (simpler than a join filter)
    const searchLower = search.toLowerCase();
    const filteredFormatted = search
        ? formatted.filter(p =>
            p.restaurant?.name?.toLowerCase().includes(searchLower) ||
            p.content.toLowerCase().includes(searchLower)
          )
        : formatted;

    return c.json({
        data: filteredFormatted,
        pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    });
});
