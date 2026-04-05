/**
 * Email Templates routes — Admin section for managing email templates
 *
 * GET  /email-templates            — List templates (filtered by category)
 * GET  /email-templates/:id        — Get single template
 * POST /email-templates            — Create template (super_admin only)
 * PUT  /email-templates/:id        — Update template (super_admin only)
 * DELETE /email-templates/:id      — Delete template (super_admin only)
 */

import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const emailTemplatesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

type EmailTemplate = {
    id: string;
    name: string;
    category: "restaurant" | "supplier" | "client";
    subject: string;
    body: string;
    variables: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    version: number;
};

/** GET /email-templates — List all templates, optionally filtered by category */
emailTemplatesRoutes.get("/", async (c) => {
    const category = c.req.query("category") as string | undefined;
    const isActive = c.req.query("is_active") as string | undefined;

    let query = c.var.supabase.from("email_templates").select("*");

    if (category && ["restaurant", "supplier", "client"].includes(category)) {
        query = query.eq("category", category);
    }

    if (isActive !== undefined) {
        query = query.eq("is_active", isActive === "true");
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("Email templates list error:", error);
        return c.json({ error: "Erreur lors de la récupération des modèles de courriel" }, 500);
    }

    return c.json({ templates: (data ?? []) as EmailTemplate[], total: data?.length ?? 0 });
});

/** GET /email-templates/:id — Get single template */
emailTemplatesRoutes.get("/:id", async (c) => {
    const id = c.req.param("id");

    const { data, error } = await c.var.supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return c.json({ error: "Modèle de courriel non trouvé" }, 404);
    }

    return c.json({ template: data as EmailTemplate });
});

/** POST /email-templates — Create new template (super_admin only) */
emailTemplatesRoutes.post("/", async (c) => {
    // Check super_admin permission
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé. Super admin uniquement." }, 403);
    }

    const body = await c.req.json() as any;

    // Validation
    if (!body.name?.trim()) return c.json({ error: "Le nom du modèle est requis" }, 400);
    if (!body.category || !["restaurant", "supplier", "client"].includes(body.category)) {
        return c.json({ error: "Catégorie invalide (restaurant, supplier, client)" }, 400);
    }
    if (!body.subject?.trim()) return c.json({ error: "L'objet du courriel est requis" }, 400);
    if (!body.body?.trim()) return c.json({ error: "Le corps du courriel est requis" }, 400);

    const templateId = crypto.randomUUID();

    const { data, error } = await c.var.supabase
        .from("email_templates")
        .insert({
            id: templateId,
            name: body.name.trim(),
            category: body.category,
            subject: body.subject.trim(),
            body: body.body.trim(),
            variables: Array.isArray(body.variables) ? body.variables : [],
            created_by: c.var.userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: body.is_active ?? true,
            version: 1,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") return c.json({ error: "Ce nom de modèle existe déjà" }, 409);
        console.error("Email template create error:", error);
        return c.json({ error: "Erreur lors de la création du modèle de courriel" }, 500);
    }

    return c.json({ template: data as EmailTemplate }, 201);
});

/** PUT /email-templates/:id — Update template (super_admin only) */
emailTemplatesRoutes.put("/:id", async (c) => {
    // Check super_admin permission
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé. Super admin uniquement." }, 403);
    }

    const id = c.req.param("id");
    const body = await c.req.json() as any;

    // Fetch existing template
    const { data: existing, error: fetchError } = await c.var.supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !existing) {
        return c.json({ error: "Modèle de courriel non trouvé" }, 404);
    }

    // Validation for optional updates
    if (body.category && !["restaurant", "supplier", "client"].includes(body.category)) {
        return c.json({ error: "Catégorie invalide (restaurant, supplier, client)" }, 400);
    }

    const updateData = {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.subject !== undefined && { subject: body.subject.trim() }),
        ...(body.body !== undefined && { body: body.body.trim() }),
        ...(body.variables !== undefined && { variables: Array.isArray(body.variables) ? body.variables : [] }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        updated_at: new Date().toISOString(),
        version: (existing.version ?? 1) + 1,
    };

    const { data, error } = await c.var.supabase
        .from("email_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        if (error.code === "23505") return c.json({ error: "Ce nom de modèle existe déjà" }, 409);
        console.error("Email template update error:", error);
        return c.json({ error: "Erreur lors de la mise à jour du modèle de courriel" }, 500);
    }

    return c.json({ template: data as EmailTemplate });
});

/** DELETE /email-templates/:id — Delete template (super_admin only) */
emailTemplatesRoutes.delete("/:id", async (c) => {
    // Check super_admin permission
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé. Super admin uniquement." }, 403);
    }

    const id = c.req.param("id");

    const { error } = await c.var.supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Email template delete error:", error);
        return c.json({ error: "Erreur lors de la suppression du modèle de courriel" }, 500);
    }

    return c.json({ success: true }, 200);
});
