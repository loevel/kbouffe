/**
 * Capital API — Score & Applications
 *
 * GET  /score                  — Calcule le score en temps réel (pas de DB write)
 * POST /applications           — Soumet une demande de financement
 * GET  /applications           — Historique des demandes du restaurant
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";
import { computeScore } from "../lib/scoring";
import type { CreateApplicationRequest, ScoreBreakdown } from "../lib/types";

export const capitalRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /score — Calcule et retourne le score sans persistance */
capitalRoutes.get("/score", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;

    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Récupérer les commandes des 90 derniers jours
    const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total, payment_status, created_at")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", since90);

    if (ordersError) return c.json({ error: "Erreur lors du calcul du score" }, 500);

    const allOrders = orders ?? [];
    const paidOrders = allOrders.filter((o: any) => o.payment_status === "paid");

    const monthly_revenue = Math.floor(
        paidOrders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0) / 3
    );
    const payment_rate = allOrders.length > 0
        ? Math.round((paidOrders.length / allOrders.length) * 100)
        : 0;
    const orders_per_month = Math.round(allOrders.length / 3);

    // 2. Ancienneté du compte
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("created_at")
        .eq("id", restaurantId)
        .single();

    const createdAt = restaurant?.created_at ? new Date(restaurant.created_at) : new Date();
    const account_age_months = Math.floor(
        (Date.now() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );

    const breakdown: ScoreBreakdown = {
        monthly_revenue,
        payment_rate,
        orders_per_month,
        account_age_months,
    };

    const result = computeScore(breakdown);
    return c.json({ score: result });
});

/** POST /applications — Créer une demande de financement */
capitalRoutes.post("/applications", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const body: CreateApplicationRequest = await c.req.json();

    if (!body.requested_amount || body.requested_amount <= 0) {
        return c.json({ error: "Le montant demandé est requis" }, 400);
    }
    if (!body.bank_partner) {
        return c.json({ error: "La banque partenaire est requise" }, 400);
    }

    // Recalculer le score au moment de la soumission
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data: orders } = await supabase
        .from("orders")
        .select("total, payment_status, created_at")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", since90);

    const allOrders = orders ?? [];
    const paidOrders = allOrders.filter((o: any) => o.payment_status === "paid");
    const monthly_revenue = Math.floor(
        paidOrders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0) / 3
    );

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("created_at")
        .eq("id", restaurantId)
        .single();

    const account_age_months = Math.floor(
        (Date.now() - new Date(restaurant?.created_at ?? Date.now()).getTime())
        / (30 * 24 * 60 * 60 * 1000)
    );

    const breakdown = {
        monthly_revenue,
        payment_rate: allOrders.length > 0
            ? Math.round((paidOrders.length / allOrders.length) * 100)
            : 0,
        orders_per_month: Math.round(allOrders.length / 3),
        account_age_months,
    };

    const computed = computeScore(breakdown);

    if (!computed.eligible) {
        return c.json({
            error: `Score insuffisant (${computed.score}/100 — grade ${computed.risk_grade}). Score minimum requis: 40`,
            score: computed,
        }, 422);
    }

    const { data, error } = await supabase
        .from("capital_applications")
        .insert({
            restaurant_id: restaurantId,
            score: computed.score,
            risk_grade: computed.risk_grade,
            score_breakdown: breakdown,
            requested_amount: body.requested_amount,
            bank_partner: body.bank_partner,
            status: "submitted",
            submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, application: data }, 201);
});

/** GET /applications — Historique des demandes */
capitalRoutes.get("/applications", async (c) => {
    const { data, error } = await c.var.supabase
        .from("capital_applications")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false });

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ applications: data ?? [] });
});
