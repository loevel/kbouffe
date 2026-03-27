/**
 * Capital Admin API — Gestion des dossiers de financement
 *
 * GET  /admin/capital/applications         — Liste toutes les demandes (avec filtres)
 * GET  /admin/capital/applications/:id     — Détail d'une demande
 * PATCH /admin/capital/applications/:id    — Mise à jour statut (reviewing/approved/rejected)
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";
import type { UpdateApplicationRequest } from "../lib/types";

export const capitalAdminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET / — Liste toutes les demandes */
capitalAdminRoutes.get("/", async (c) => {
    const status = c.req.query("status");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    let query = c.var.supabase
        .from("capital_applications")
        .select(`
            *,
            restaurant:restaurants(id, name, city, phone)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;
    if (error) return c.json({ error: error.message }, 500);

    return c.json({
        applications: data ?? [],
        pagination: {
            page, limit, total: count ?? 0,
            totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
        },
    });
});

/** GET /:id — Détail */
capitalAdminRoutes.get("/:id", async (c) => {
    const { data, error } = await c.var.supabase
        .from("capital_applications")
        .select(`
            *,
            restaurant:restaurants(id, name, city, phone, address, rccm, nif)
        `)
        .eq("id", c.req.param("id"))
        .single();

    if (error || !data) return c.json({ error: "Dossier introuvable" }, 404);
    return c.json({ application: data });
});

/** PATCH /:id — Mettre à jour le statut (admin ou banque) */
capitalAdminRoutes.patch("/:id", async (c) => {
    const body: UpdateApplicationRequest = await c.req.json();
    const adminId = c.var.userId;

    if (!body.status) return c.json({ error: "Le statut est requis" }, 400);

    const updateData: Record<string, unknown> = {
        status: body.status,
        reviewer_id: adminId,
        reviewed_at: new Date().toISOString(),
    };
    if (body.bank_reference) updateData.bank_reference = body.bank_reference;
    if (body.notes) updateData.notes = body.notes;

    const { data, error } = await c.var.supabase
        .from("capital_applications")
        .update(updateData)
        .eq("id", c.req.param("id"))
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, application: data });
});
