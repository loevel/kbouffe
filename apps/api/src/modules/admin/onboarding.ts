import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminOnboardingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

function db(c: any) {
    return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
}

// Onboarding criteria and their weights
const CRITERIA = [
    { key: "hasLogo",          label: "Logo",             weight: 15 },
    { key: "hasBanner",        label: "Bannière",         weight: 10 },
    { key: "hasDescription",   label: "Description",      weight: 10 },
    { key: "hasPhone",         label: "Téléphone",        weight: 10 },
    { key: "hasEmail",         label: "Email",            weight: 10 },
    { key: "hasAddress",       label: "Adresse",          weight: 10 },
    { key: "hasOpeningHours",  label: "Horaires",         weight: 15 },
    { key: "hasProducts",      label: "Produits (≥3)",    weight: 10 },
    { key: "hasProductImages", label: "Photos produits",  weight: 5  },
    { key: "isPublished",      label: "Boutique publiée", weight: 5  },
] as const;

type CriterionKey = typeof CRITERIA[number]["key"];

function computeScore(flags: Record<CriterionKey, boolean>): number {
    return CRITERIA.reduce((sum, c) => sum + (flags[c.key] ? c.weight : 0), 0);
}

// ── GET /admin/onboarding — restaurant list with scores ──────────────────────
adminOnboardingRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const supabase = db(c);
    const minScore = parseInt(c.req.query("maxScore") ?? "100");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, parseInt(c.req.query("limit") ?? "30"));

    // Fetch all restaurants + product counts in parallel
    const [{ data: restaurants }, { data: productStats }, { data: lastReminders }] = await Promise.all([
        supabase
            .from("restaurants")
            .select("id, name, slug, email, phone, logo_url, banner_url, description, address, opening_hours, is_published, created_at, owner_id")
            .order("created_at", { ascending: false }),
        supabase
            .from("products")
            .select("restaurant_id, image_url, is_available"),
        supabase
            .from("admin_reminders")
            .select("restaurant_id, sent_at")
            .eq("type", "onboarding")
            .order("sent_at", { ascending: false }),
    ]);

    // Build product counts per restaurant
    const productCounts = new Map<string, { total: number; withImage: number }>();
    for (const p of productStats ?? []) {
        const rid = (p as any).restaurant_id as string;
        const existing = productCounts.get(rid) ?? { total: 0, withImage: 0 };
        existing.total++;
        if ((p as any).image_url) existing.withImage++;
        productCounts.set(rid, existing);
    }

    // Last reminder per restaurant
    const lastReminderMap = new Map<string, string>();
    for (const r of lastReminders ?? []) {
        const rid = (r as any).restaurant_id as string;
        if (!lastReminderMap.has(rid)) {
            lastReminderMap.set(rid, (r as any).sent_at as string);
        }
    }

    // Parse opening hours: valid if JSONB is an object with at least 1 day having times
    function hasOpeningHours(oh: any): boolean {
        if (!oh || typeof oh !== "object") return false;
        return Object.values(oh).some((day: any) => day && (day.open || day.from || day.is_open || Array.isArray(day)));
    }

    const scored = (restaurants ?? []).map((r: any) => {
        const products = productCounts.get(r.id) ?? { total: 0, withImage: 0 };
        const flags: Record<CriterionKey, boolean> = {
            hasLogo:          !!r.logo_url,
            hasBanner:        !!r.banner_url,
            hasDescription:   !!(r.description && r.description.trim().length > 10),
            hasPhone:         !!r.phone,
            hasEmail:         !!r.email,
            hasAddress:       !!r.address,
            hasOpeningHours:  hasOpeningHours(r.opening_hours),
            hasProducts:      products.total >= 3,
            hasProductImages: products.total > 0 && (products.withImage / products.total) >= 0.5,
            isPublished:      !!r.is_published,
        };
        const score = computeScore(flags);
        const missingCriteria = CRITERIA.filter(c => !flags[c.key]).map(c => ({ key: c.key, label: c.label, weight: c.weight }));

        return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            email: r.email,
            phone: r.phone,
            logoUrl: r.logo_url,
            isPublished: r.is_published,
            createdAt: r.created_at,
            score,
            flags,
            missingCriteria,
            productCount: products.total,
            lastReminderAt: lastReminderMap.get(r.id) ?? null,
        };
    });

    // Filter by max score if requested
    const filtered = c.req.query("maxScore")
        ? scored.filter(r => r.score <= minScore)
        : scored;

    // Sort by score ascending (worst first)
    filtered.sort((a, b) => a.score - b.score);

    // Stats
    const total = filtered.length;
    const blocked = filtered.filter(r => r.score < 50).length;
    const avgScore = total > 0 ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / total) : 0;

    // Pagination
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return c.json({
        data: paginated,
        stats: { total, blocked, avgScore },
        criteria: CRITERIA,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
});

// ── POST /admin/onboarding/remind/:id — send a relance email ─────────────────
adminOnboardingRoutes.post("/remind/:id", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const supabase = db(c);
    const restaurantId = c.req.param("id");
    const adminId = c.get("userId") as string;

    // Fetch restaurant
    const { data: restaurant, error: restError } = await supabase
        .from("restaurants")
        .select("id, name, email, owner_id")
        .eq("id", restaurantId)
        .maybeSingle();

    if (restError || !restaurant) return c.json({ error: "Restaurant introuvable" }, 404);

    const recipientEmail = (restaurant as any).email;
    if (!recipientEmail) return c.json({ error: "Ce restaurant n'a pas d'email enregistré" }, 400);

    // Log the reminder
    const { error: logError } = await supabase.from("admin_reminders").insert({
        restaurant_id: restaurantId,
        sent_by: adminId ?? null,
        type: "onboarding",
        email: recipientEmail,
        message: `Relance onboarding envoyée à ${recipientEmail} pour ${(restaurant as any).name}`,
    });

    if (logError) {
        console.error("[remind] log error:", logError);
    }

    // Attempt Resend email if API key is configured
    const resendKey = c.env.RESEND_API_KEY as string | undefined;
    let emailSent = false;

    if (resendKey) {
        try {
            const emailRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${resendKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "KBouffe <noreply@kbouffe.com>",
                    to: [recipientEmail],
                    subject: `Complétez votre profil KBouffe — ${(restaurant as any).name}`,
                    html: `
                        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
                            <h2 style="color:#111;margin-bottom:8px">Bonjour 👋</h2>
                            <p style="color:#555;line-height:1.6">
                                Votre restaurant <strong>${(restaurant as any).name}</strong> sur KBouffe
                                n'est pas encore entièrement configuré. Complétez votre profil pour
                                <strong>augmenter votre visibilité</strong> et attirer plus de clients.
                            </p>
                            <div style="margin:24px 0">
                                <a href="https://dashboard.kbouffe.com/dashboard/settings"
                                   style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                                    Compléter mon profil →
                                </a>
                            </div>
                            <p style="color:#999;font-size:12px">
                                L'équipe KBouffe
                            </p>
                        </div>
                    `,
                }),
            });
            emailSent = emailRes.ok;
        } catch (e) {
            console.error("[remind] Resend error:", e);
        }
    }

    await logAdminAction(supabase, adminId, "send_onboarding_reminder", "restaurant", restaurantId, {
        email: recipientEmail,
        emailSent,
    });

    return c.json({
        success: true,
        emailSent,
        message: emailSent
            ? `Email envoyé à ${recipientEmail}`
            : `Relance enregistrée. Configurez RESEND_API_KEY pour l'envoi automatique.`,
        restaurantName: (restaurant as any).name,
    });
});
