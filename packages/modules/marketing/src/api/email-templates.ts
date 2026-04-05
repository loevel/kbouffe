/**
 * Email Templates routes — Admin section for managing email templates
 *
 * GET  /email-templates            — List templates (filtered by category)
 * GET  /email-templates/:id        — Get single template
 * POST /email-templates            — Create template (super_admin only)
 * PUT  /email-templates/:id        — Update template (super_admin only)
 * DELETE /email-templates/:id      — Delete template (super_admin only)
 * POST /email-templates/:id/ai/improve — Improve template with AI
 * POST /email-templates/ai/generate    — Generate new template with AI
 * POST /email-templates/:id/ai/translate — Translate template
 * POST /email-templates/:id/ai/variants  — Generate A/B testing variants
 */

import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";
import { improveTemplate, generateTemplate, translateTemplate, generateVariants } from "./email-ai";

export const emailTemplatesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Type helper to access AI from environment
const getAI = (c: any) => (c.env as any).AI;

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

/** POST /email-templates/:id/ai/improve — Improve template with AI */
emailTemplatesRoutes.post("/:id/ai/improve", async (c) => {
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé. Super admin uniquement." }, 403);
    }

    const id = c.req.param("id");
    const body = await c.req.json() as any;

    // Fetch template
    const { data: template, error: fetchError } = await c.var.supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !template) {
        return c.json({ error: "Modèle de courriel non trouvé" }, 404);
    }

    try {
        const ai = getAI(c);
        if (!ai) {
            return c.json({ error: "Service d'IA non disponible" }, 503);
        }
        const suggestions = await improveTemplate(ai, {
            subject: template.subject,
            body: template.body,
            category: template.category,
        });

        return c.json({ suggestions });
    } catch (error) {
        console.error("AI improve error:", error);
        return c.json({ error: "Erreur lors de l'amélioration du modèle avec l'IA" }, 500);
    }
});

/** POST /email-templates/ai/generate — Generate new template with AI */
emailTemplatesRoutes.post("/ai/generate", async (c) => {
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé. Super admin uniquement." }, 403);
    }

    const body = await c.req.json() as any;

    if (!body.category || !["restaurant", "supplier", "client"].includes(body.category)) {
        return c.json({ error: "Catégorie invalide" }, 400);
    }

    if (!body.topic?.trim()) {
        return c.json({ error: "Le sujet est requis" }, 400);
    }

    try {
        const ai = getAI(c);
        if (!ai) {
            return c.json({ error: "Service d'IA non disponible" }, 503);
        }
        const generated = await generateTemplate(ai, {
            category: body.category,
            topic: body.topic.trim(),
            tone: body.tone ?? "professional",
        });

        return c.json({ template: generated });
    } catch (error) {
        console.error("AI generate error:", error);
        return c.json({ error: "Erreur lors de la génération du modèle avec l'IA" }, 500);
    }
});

/** POST /email-templates/:id/ai/translate — Translate template */
emailTemplatesRoutes.post("/:id/ai/translate", async (c) => {
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé. Super admin uniquement." }, 403);
    }

    const id = c.req.param("id");
    const body = await c.req.json() as any;

    if (!["en", "fr"].includes(body.toLang)) {
        return c.json({ error: "Langue cible invalide (en, fr)" }, 400);
    }

    // Fetch template
    const { data: template, error: fetchError } = await c.var.supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !template) {
        return c.json({ error: "Modèle de courriel non trouvé" }, 404);
    }

    try {
        const ai = getAI(c);
        if (!ai) {
            return c.json({ error: "Service d'IA non disponible" }, 503);
        }
        const fromLang = body.fromLang ?? "fr";

        const translated = await translateTemplate(ai, {
            subject: template.subject,
            body: template.body,
            fromLang: fromLang as any,
            toLang: body.toLang,
        });

        return c.json({ template: translated });
    } catch (error) {
        console.error("AI translate error:", error);
        return c.json({ error: "Erreur lors de la traduction du modèle" }, 500);
    }
});

/** POST /email-templates/:id/ai/variants — Generate A/B testing variants */
emailTemplatesRoutes.post("/:id/ai/variants", async (c) => {
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé. Super admin uniquement." }, 403);
    }

    const id = c.req.param("id");

    // Fetch template
    const { data: template, error: fetchError } = await c.var.supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !template) {
        return c.json({ error: "Modèle de courriel non trouvé" }, 404);
    }

    try {
        const ai = getAI(c);
        if (!ai) {
            return c.json({ error: "Service d'IA non disponible" }, 503);
        }
        const variants = await generateVariants(ai, template.subject, template.body, template.category);

        return c.json({ variants });
    } catch (error) {
        console.error("AI variants error:", error);
        return c.json({ error: "Erreur lors de la génération des variantes" }, 500);
    }
});

/** POST /email-templates/:id/send — Bulk send template to recipients */
emailTemplatesRoutes.post("/:id/send", async (c) => {
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé" }, 403);
    }

    const templateId = c.req.param("id");
    const body = await c.req.json();

    // Validate request
    const { recipients, variables_mapping } = body;
    if (!Array.isArray(recipients) || recipients.length === 0) {
        return c.json({ error: "La liste des destinataires est vide" }, 400);
    }

    // Fetch template
    const { data: template, error: fetchError } = await c.var.supabase
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .single();

    if (fetchError || !template) {
        return c.json({ error: "Modèle de courriel non trouvé" }, 404);
    }

    if (!template.is_active) {
        return c.json({ error: "Ce modèle n'est pas activé" }, 400);
    }

    try {
        const sends: any[] = [];
        const userId = c.var.userId;

        // Process each recipient
        for (const recipient of recipients) {
            const { email, name, id: recipientId, type: recipientType, variables: recipientVars } = recipient;

            if (!email || !recipientType) {
                continue; // Skip invalid recipients
            }

            // Render template with recipient variables
            let subject = template.subject;
            let body = template.body;

            const vars = recipientVars || variables_mapping?.[recipientId] || {};
            for (const [key, value] of Object.entries(vars)) {
                const placeholder = `{{${key}}}`;
                subject = subject.replaceAll(placeholder, String(value));
                body = body.replaceAll(placeholder, String(value));
            }

            // Create email_sends record
            const { data: send, error: insertError } = await c.var.supabase
                .from("email_sends")
                .insert({
                    template_id: templateId,
                    recipient_type: recipientType,
                    recipient_id: recipientId,
                    recipient_email: email,
                    recipient_name: name || email,
                    subject_rendered: subject,
                    body_rendered: body,
                    variables_json: vars,
                    sent_by: userId,
                })
                .select()
                .single();

            if (!insertError && send) {
                sends.push(send);

                // Queue to email-send-queue (Cloudflare Queues)
                // This would be done via environment variable batch sender
                // For now, just track that we've queued it
                console.log(`Queued email send: ${send.id} to ${email}`);
            }
        }

        if (sends.length === 0) {
            return c.json({ error: "Aucun email n'a pu être ajouté à la file d'attente" }, 400);
        }

        return c.json({
            success: true,
            sent_count: sends.length,
            sends: sends.map((s) => ({
                id: s.id,
                recipient_email: s.recipient_email,
                tracking_token: s.tracking_token,
                sent_at: s.sent_at,
            })),
        });
    } catch (error) {
        console.error("Bulk send error:", error);
        return c.json({ error: "Erreur lors de l'envoi en masse" }, 500);
    }
});

/** GET /email-templates/:id/sends — Get send history for a template */
emailTemplatesRoutes.get("/:id/sends", async (c) => {
    if (c.var.adminRole !== "super_admin") {
        return c.json({ error: "Accès refusé" }, 403);
    }

    const templateId = c.req.param("id");
    const limit = parseInt(c.req.query("limit") || "50", 10);
    const offset = parseInt(c.req.query("offset") || "0", 10);

    // Get sends for this template
    const { data: sends, error, count } = await c.var.supabase
        .from("email_sends")
        .select("id, recipient_email, recipient_name, sent_at, opened_at, clicked_at, bounced_at", {
            count: "exact",
        })
        .eq("template_id", templateId)
        .order("sent_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return c.json({ error: "Erreur lors de la récupération des envois" }, 500);
    }

    return c.json({
        sends: sends || [],
        total: count || 0,
        limit,
        offset,
    });
});
