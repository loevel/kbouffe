"use client";

/**
 * Reports module — API
 *
 * Exporte un sous-routeur Hono prêt à être monté sous /reports.
 * Contient des endpoints de base (summary, top-products, timeseries)
 * qui peuvent être branchés sur la vraie source de données plus tard.
 */
import { Hono } from "hono";

export const reportsRoutes = new Hono();

// Rapport de synthèse (chiffre d'affaires, commandes, clients)
reportsRoutes.get("/summary", async (c) => {
    // TODO: brancher sur Supabase / Analytics
    return c.json({
        revenueToday: 0,
        revenueWeek: 0,
        ordersToday: 0,
        customers: 0,
        generatedAt: new Date().toISOString(),
    });
});

// Top produits
reportsRoutes.get("/top-products", async (c) => {
    const limit = Number(c.req.query("limit") ?? 5);
    return c.json({
        items: [],
        limit,
        generatedAt: new Date().toISOString(),
    });
});

// Série temporelle (par jour)
reportsRoutes.get("/timeseries", async (c) => {
    const days = Number(c.req.query("days") ?? 14);
    const today = new Date();
    const series = Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - i - 1));
        return { date: d.toISOString().slice(0, 10), value: 0 };
    });
    return c.json({ series, generatedAt: today.toISOString() });
});

export default reportsRoutes;
