/**
 * Restaurant Brands & KYC API (Dark Kitchens / Multi-Marques)
 *
 * Légal:
 * - KBouffe est un fournisseur SaaS. Il n'est pas gérant des établissements.
 * - Chaque restaurateur DÉCLARE (déclaration liante) posséder toutes les
 *   licences pour chaque marque exploitée depuis sa cuisine.
 * - Le KYC (RCCM, NIF, Licence sanitaire) doit être approuvé avant publication.
 *
 * Ref: Loi n°2011/012 Art.26 (ordre public),
 *      OHADA AUDCG Art.35 (RCCM/NIF commerçants),
 *      Arrêté n°0007/A/MINSANTE (hygiène alimentaire)
 *
 * Routes merchant:
 *   GET    /restaurant/brands          — Liste les marques du restaurant
 *   POST   /restaurant/brands          — Créer une marque (declaration liante requise)
 *   PATCH  /restaurant/brands/:id      — Modifier une marque
 *   DELETE /restaurant/brands/:id      — Désactiver une marque
 *   PATCH  /restaurant/kyc             — Soumettre les docs KYC
 *
 * Routes admin:
 *   GET    /admin/brands               — Liste toutes les marques
 *   PATCH  /admin/brands/restaurants/:restaurantId/kyc — Approuver/rejeter KYC
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "./types";

export const brandsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
export const restaurantKycRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
export const brandsAdminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Merchant routes ─────────────────────────────────────────────────────────

/** GET /restaurant/brands */
brandsRoutes.get("/", async (c) => {
    const { data, error } = await c.var.supabase
        .from("restaurant_brands")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ brands: data ?? [] });
});

/** POST /restaurant/brands — Créer une marque (contrat liant) */
brandsRoutes.post("/", async (c) => {
    const body = await c.req.json();
    const { brand_name, cuisine_type, description, logo_url, licence_sanitaire, legal_declaration } = body;

    if (!brand_name?.trim()) return c.json({ error: "Le nom de la marque est requis" }, 400);
    if (!cuisine_type?.trim()) return c.json({ error: "Le type de cuisine est requis" }, 400);
    if (!legal_declaration) {
        return c.json({
            error: "Vous devez cocher la déclaration légale attestant que vous possédez toutes les licences nécessaires (RCCM, NIF, Licence sanitaire) pour cette marque.",
        }, 422);
    }

    const { data, error } = await c.var.supabase
        .from("restaurant_brands")
        .insert({
            restaurant_id: c.var.restaurantId,
            brand_name: brand_name.trim(),
            cuisine_type: cuisine_type.trim(),
            description: description?.trim() ?? null,
            logo_url: logo_url ?? null,
            licence_sanitaire: licence_sanitaire?.trim() ?? null,
            legal_declaration: true,
            is_active: true,
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, brand: data }, 201);
});

/** PATCH /restaurant/brands/:id */
brandsRoutes.patch("/:id", async (c) => {
    const body = await c.req.json();
    const { brand_name, cuisine_type, description, logo_url, licence_sanitaire } = body;

    const updates: Record<string, unknown> = {};
    if (brand_name !== undefined) updates.brand_name = brand_name.trim();
    if (cuisine_type !== undefined) updates.cuisine_type = cuisine_type.trim();
    if (description !== undefined) updates.description = description;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (licence_sanitaire !== undefined) updates.licence_sanitaire = licence_sanitaire;

    const { data, error } = await c.var.supabase
        .from("restaurant_brands")
        .update(updates)
        .eq("id", c.req.param("id"))
        .eq("restaurant_id", c.var.restaurantId)
        .select()
        .single();

    if (error || !data) return c.json({ error: "Marque introuvable" }, 404);
    return c.json({ success: true, brand: data });
});

/** DELETE /restaurant/brands/:id — Désactivation (pas suppression) */
brandsRoutes.delete("/:id", async (c) => {
    const { error } = await c.var.supabase
        .from("restaurant_brands")
        .update({ is_active: false })
        .eq("id", c.req.param("id"))
        .eq("restaurant_id", c.var.restaurantId);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
});

/**
 * PATCH /restaurant/kyc — Soumettre les documents KYC
 * Obligatoire avant publication (is_published = true)
 * Monté séparément sur restaurantKycRoutes → api.route("/restaurant/kyc", restaurantKycRoutes)
 */
restaurantKycRoutes.patch("/", async (c) => {
    const body = await c.req.json();
    const { rccm, nif, licence_sanitaire } = body;

    if (!rccm?.trim()) return c.json({ error: "Le numéro RCCM est requis" }, 400);
    if (!nif?.trim()) return c.json({ error: "Le Numéro Identifiant Unique (NIF) est requis" }, 400);

    const { error } = await c.var.supabase
        .from("restaurants")
        .update({
            rccm: rccm.trim(),
            nif: nif.trim(),
            licence_sanitaire: licence_sanitaire?.trim() ?? null,
            kyc_status: "documents_submitted",
            kyc_submitted_at: new Date().toISOString(),
        })
        .eq("id", c.var.restaurantId);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, message: "Documents KYC soumis. En attente de validation." });
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

/** GET /admin/brands — Toutes les marques (avec filtres) */
brandsAdminRoutes.get("/", async (c) => {
    const restaurantId = c.req.query("restaurant_id");
    let query = c.var.supabase
        .from("restaurant_brands")
        .select("*, restaurant:restaurants(id, name, city, kyc_status)");

    if (restaurantId) query = query.eq("restaurant_id", restaurantId);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ brands: data ?? [] });
});

/**
 * PATCH /admin/brands/restaurants/:restaurantId/kyc
 * Approuver ou rejeter le KYC d'un restaurant
 */
brandsAdminRoutes.patch("/restaurants/:restaurantId/kyc", async (c) => {
    const body = await c.req.json();
    const { status, notes } = body;

    if (!["approved", "rejected"].includes(status)) {
        return c.json({ error: "Statut invalide. Valeurs: approved | rejected" }, 400);
    }

    const { error } = await c.var.supabase
        .from("restaurants")
        .update({
            kyc_status: status,
            kyc_notes: notes ?? null,
            kyc_reviewed_at: new Date().toISOString(),
            kyc_reviewer_id: c.var.userId,
        })
        .eq("id", c.req.param("restaurantId"));

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, message: `KYC ${status === "approved" ? "approuvé" : "rejeté"}` });
});
