/**
 * Marketing campaigns routes
 *
 * GET   /marketing/campaigns          — List campaigns
 * POST  /marketing/campaigns          — Create a campaign
 * PATCH /marketing/campaigns/:id      — Cancel a campaign
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

const PACKAGE_PRICES = { basic: 15000, premium: 35000, elite: 75000 } as const;
const PACKAGE_DAYS = { basic: 7, premium: 14, elite: 30 } as const;

export const marketingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /marketing/campaigns */
marketingRoutes.get("/campaigns", async (c) => {
    const { data, error } = await c.var.supabase
        .from("ad_campaigns")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Campaigns query error:", error);
        return c.json({ error: "Erreur lors de la récupération des campagnes" }, 500);
    }

    const campaigns = data ?? [];
    const now = new Date().toISOString();
    const activeCampaign = campaigns.find(
        (cam: any) => cam.status === "active" && cam.starts_at <= now && cam.ends_at >= now,
    ) ?? null;

    return c.json({ campaigns, activeCampaign, total: campaigns.length });
});

/** POST /marketing/campaigns */
marketingRoutes.post("/campaigns", async (c) => {
    const body = await c.req.json();

    if (!["basic", "premium", "elite"].includes(body.package)) {
        return c.json({ error: "Forfait invalide" }, 400);
    }

    const pkg = body.package as keyof typeof PACKAGE_PRICES;
    const durationDays = PACKAGE_DAYS[pkg];
    const budget = PACKAGE_PRICES[pkg];

    const startsAt = body.starts_at ? new Date(body.starts_at) : new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + durationDays);

    const includePush = Boolean(body.include_push);
    if (includePush && !body.push_message?.trim()) {
        return c.json({ error: "Le message de la notification push est requis" }, 400);
    }

    const { data, error } = await c.var.supabase
        .from("ad_campaigns")
        .insert({
            id: crypto.randomUUID(),
            restaurant_id: c.var.restaurantId,
            package: pkg,
            status: "pending" as const,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            budget,
            include_push: includePush,
            push_sent: false,
            push_message: includePush ? body.push_message.trim() : null,
            impressions: 0,
            clicks: 0,
            notes: body.notes ?? null,
            created_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

    if (error) {
        console.error("Campaign create error:", error);
        return c.json({ error: "Erreur lors de la création de la campagne" }, 500);
    }

    return c.json({ campaign: data }, 201);
});

/** PATCH /marketing/campaigns/:id */
marketingRoutes.patch("/campaigns/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    if (body.status !== "cancelled") {
        return c.json({ error: "Seule l'annulation est autorisée depuis le dashboard" }, 400);
    }

    const { data: existing } = await c.var.supabase
        .from("ad_campaigns")
        .select("id, status")
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (!existing) return c.json({ error: "Campagne introuvable" }, 404);
    const ex = existing as { id: string; status: string };
    if (ex.status === "completed") return c.json({ error: "Impossible d'annuler une campagne terminée" }, 400);
    if (ex.status === "cancelled") return c.json({ error: "Campagne déjà annulée" }, 400);

    const { data, error } = await c.var.supabase
        .from("ad_campaigns")
        .update({ status: "cancelled", updated_at: new Date().toISOString() } as any)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Campaign cancel error:", error);
        return c.json({ error: "Erreur lors de l'annulation de la campagne" }, 500);
    }

    return c.json({ campaign: data });
});
