/**
 * Gallery routes
 *
 * GET    /gallery             — Gallery config (max_photos) + photos list
 * POST   /gallery/photos      — Add a photo (enforces quota)
 * PATCH  /gallery/photos/:id  — Update photo (alt_text, display_order, is_featured)
 * DELETE /gallery/photos/:id  — Delete a photo
 * GET    /gallery/pack        — Current gallery pack subscription status
 * GET    /gallery/packs       — Available gallery packs (public)
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const galleryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /gallery — gallery config + photos */
galleryRoutes.get("/", async (c) => {
    const { restaurantId, supabase } = c.var;

    const [galleryRes, photosRes] = await Promise.all([
        (supabase as any)
            .from("restaurant_galleries")
            .select("max_photos")
            .eq("restaurant_id", restaurantId)
            .single(),
        (supabase as any)
            .from("restaurant_photos")
            .select("id, photo_url, alt_text, display_order, is_featured")
            .eq("restaurant_id", restaurantId)
            .order("display_order", { ascending: true }),
    ]);

    return c.json({
        gallery: galleryRes.data || { max_photos: 5 },
        photos: photosRes.data || [],
    });
});

/** POST /gallery/photos — add a photo */
galleryRoutes.post("/photos", async (c) => {
    const { restaurantId, supabase } = c.var;
    const body = await c.req.json();
    const { photo_url, alt_text, display_order } = body;

    if (!photo_url) return c.json({ error: "photo_url est requis" }, 400);

    const { data: gallery, error: galleryError } = await (supabase as any)
        .from("restaurant_galleries")
        .select("max_photos")
        .eq("restaurant_id", restaurantId)
        .single();

    if (galleryError || !gallery) return c.json({ error: "Configuration de galerie non trouvée" }, 500);

    const { count } = await (supabase as any)
        .from("restaurant_photos")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId);

    if ((count || 0) >= gallery.max_photos) return c.json({ error: "Quota de photos atteint" }, 400);

    let finalDisplayOrder = display_order;
    if (finalDisplayOrder === undefined) {
        const { data: last } = await (supabase as any)
            .from("restaurant_photos")
            .select("display_order")
            .eq("restaurant_id", restaurantId)
            .order("display_order", { ascending: false })
            .limit(1);
        finalDisplayOrder = (last?.[0]?.display_order ?? -1) + 1;
    }

    const { data, error } = await (supabase as any)
        .from("restaurant_photos")
        .insert({ restaurant_id: restaurantId, photo_url, alt_text: alt_text || "", display_order: finalDisplayOrder, is_featured: false })
        .select()
        .single();

    if (error) return c.json({ error: "Erreur lors de l'ajout de la photo" }, 500);
    return c.json(data, 201);
});

/** PATCH /gallery/photos/:id */
galleryRoutes.patch("/photos/:id", async (c) => {
    const { restaurantId, supabase } = c.var;
    const id = c.req.param("id");
    const body = await c.req.json();

    const { data: photo } = await (supabase as any)
        .from("restaurant_photos")
        .select("restaurant_id")
        .eq("id", id)
        .single();

    if (!photo) return c.json({ error: "Photo non trouvée" }, 404);
    if (photo.restaurant_id !== restaurantId) return c.json({ error: "Accès refusé" }, 403);

    const updateData: Record<string, any> = {};
    if (body.alt_text !== undefined) updateData.alt_text = body.alt_text;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;

    if (Object.keys(updateData).length === 0) return c.json({ error: "Aucun champ à mettre à jour" }, 400);

    const { data, error } = await (supabase as any)
        .from("restaurant_photos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: "Erreur lors de la mise à jour" }, 500);
    return c.json(data);
});

/** DELETE /gallery/photos/:id */
galleryRoutes.delete("/photos/:id", async (c) => {
    const { restaurantId, supabase } = c.var;
    const id = c.req.param("id");

    const { data: photo } = await (supabase as any)
        .from("restaurant_photos")
        .select("restaurant_id")
        .eq("id", id)
        .single();

    if (!photo) return c.json({ error: "Photo non trouvée" }, 404);
    if (photo.restaurant_id !== restaurantId) return c.json({ error: "Accès refusé" }, 403);

    const { error } = await (supabase as any)
        .from("restaurant_photos")
        .delete()
        .eq("id", id);

    if (error) return c.json({ error: "Erreur lors de la suppression" }, 500);
    return c.json({ success: true });
});

/** GET /gallery/pack — current pack subscription */
galleryRoutes.get("/pack", async (c) => {
    const { restaurantId, supabase } = c.var;

    const { data: gallery } = await (supabase as any)
        .from("restaurant_galleries")
        .select("max_photos, is_pack_active, pack_id, pack:pack_id(id, name, slug, description, price, duration_days, features)")
        .eq("restaurant_id", restaurantId)
        .single();

    const { data: purchase } = await (supabase as any)
        .from("marketplace_purchases")
        .select("id, status, expires_at")
        .eq("restaurant_id", restaurantId)
        .eq("service_id", gallery?.pack_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return c.json({
        gallery: {
            max_photos: gallery?.max_photos ?? 5,
            is_pack_active: gallery?.is_pack_active ?? false,
            current_pack: gallery?.pack ?? null,
            active_purchase: purchase ?? null,
        },
    });
});

/** GET /gallery/packs — available packs (public, no auth) */
galleryRoutes.get("/packs", async (c) => {
    const { supabase } = c.var;

    const { data, error } = await (supabase as any)
        .from("marketplace_services")
        .select("id, name, slug, description, price, duration_days, features, icon")
        .in("slug", ["gallery_basic", "gallery_extended", "gallery_premium"])
        .eq("is_active", true)
        .order("price", { ascending: true });

    if (error) return c.json({ error: "Erreur lors de la récupération des packs" }, 500);
    return c.json({ packs: data || [] });
});
