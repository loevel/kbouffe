/**
 * Products routes — migrated from web-dashboard/src/app/api/products/
 *
 * GET    /products          — List products
 * POST   /products          — Create a product
 * GET    /products/:id      — Get single product
 * PATCH  /products/:id      — Update a product
 * DELETE /products/:id      — Delete a product
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const productsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

function normalizeAllergens(allergens: any): string[] | null {
    if (!allergens) return null;
    if (Array.isArray(allergens)) return allergens.filter(a => !!a).map(a => a.trim());
    if (typeof allergens === "string") {
        return allergens.split(",").map(a => a.trim()).filter(a => !!a);
    }
    return null;
}

/** GET /products */
productsRoutes.get("/", async (c) => {
    const categoryId = c.req.query("category_id");

    let query = c.var.supabase
        .from("products")
        .select("*, menu_item_options(*, menu_item_option_values(*))", { count: "exact" })
        .eq("restaurant_id", c.var.restaurantId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, count, error } = await query;

    if (error) {
        console.error("Products query error:", error);
        return c.json({ error: "Erreur lors de la récupération des produits" }, 500);
    }

    return c.json({ products: data ?? [], total: count ?? 0 });
});

/** POST /products */
productsRoutes.post("/", async (c) => {
    const body = await c.req.json();

    if (!body.name?.trim()) return c.json({ error: "Le nom du produit est requis" }, 400);
    if (typeof body.price !== "number" || body.price <= 0) {
        return c.json({ error: "Le prix doit être un nombre positif" }, 400);
    }

    const { data: lastProduct } = await c.var.supabase
        .from("products")
        .select("sort_order")
        .eq("restaurant_id", c.var.restaurantId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

    // 1. Insert product
    const { data: product, error: productError } = await c.var.supabase
        .from("products")
        .insert({
            restaurant_id: c.var.restaurantId,
            name: body.name.trim(),
            description: body.description?.trim() || null,
            price: body.price,
            compare_at_price: body.compare_at_price || null,
            category_id: body.category_id || null,
            image_url: body.image_url || null,
            is_available: body.is_available ?? true,
            sort_order: ((lastProduct as any)?.sort_order ?? 0) + 1,
            // New fields
            is_halal: body.is_halal ?? false,
            is_vegan: body.is_vegan ?? false,
            is_gluten_free: body.is_gluten_free ?? false,
            allergens: normalizeAllergens(body.allergens),
            is_dine_in_only: body.is_dine_in_only ?? false,
            is_no_delivery: body.is_no_delivery ?? false,
            dine_in_price: body.dine_in_price || null,
            prep_time: body.prep_time || 15,
            calories: body.calories || null,
            tags: body.tags || null,
            options: body.options || null, // Keeping JSON for compatibility
            // Scarcity / Limited edition
            is_limited_edition: body.is_limited_edition ?? false,
            stock_quantity: body.stock_quantity ?? null,
            available_until: body.available_until ?? null,
        } as any)
        .select()
        .single();

    if (productError) {
        console.error("Create product error:", productError);
        return c.json({ error: "Erreur lors de la création du produit" }, 500);
    }

    // 2. Handle relational options if provided
    if (body.options && Array.isArray(body.options)) {
        for (const opt of body.options) {
            const { data: optionData, error: optError } = await c.var.supabase
                .from("menu_item_options")
                .insert({
                    product_id: product.id,
                    name: opt.name,
                    is_required: opt.required ?? false,
                    type: opt.type || 'single',
                })
                .select()
                .single();
            
            if (!optError && opt.choices && Array.isArray(opt.choices)) {
                await c.var.supabase
                    .from("menu_item_option_values")
                    .insert(opt.choices.map((choice: any) => ({
                        option_id: optionData.id,
                        name: choice.label,
                        price_adjustment: choice.extra_price || 0,
                    })));
            }
        }
    }

    return c.json({ success: true, product }, 201);
});

/** GET /products/:id */
productsRoutes.get("/:id", async (c) => {
    const id = c.req.param("id");

    const { data, error } = await c.var.supabase
        .from("products")
        .select("*, menu_item_options(*, menu_item_option_values(*))")
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (error || !data) return c.json({ error: "Produit non trouvé" }, 404);
    return c.json({ product: data });
});

/** PATCH /products/:id */
productsRoutes.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    const allowedFields = [
        "name", "description", "price", "compare_at_price",
        "category_id", "image_url", "is_available", "sort_order", "options",
        "is_halal", "is_vegan", "is_gluten_free", "allergens",
        "is_dine_in_only", "is_no_delivery", "dine_in_price", "prep_time", "calories", "tags",
        "is_limited_edition", "stock_quantity", "available_until"
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            if (field === "allergens") {
                updateData[field] = normalizeAllergens(body[field]);
            } else {
                updateData[field] = body[field];
            }
        }
    }
    updateData.updated_at = new Date().toISOString();

    const { data: product, error } = await c.var.supabase
        .from("products")
        .update(updateData as any)
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .select()
        .single();

    if (error) {
        console.error("Update product error:", error);
        return c.json({ error: "Erreur lors de la mise à jour" }, 500);
    }

    // Handle relational options update
    if (body.options && Array.isArray(body.options)) {
        // Simple strategy: delete and recreate
        const { data: oldOptions } = await c.var.supabase
            .from("menu_item_options")
            .select("id")
            .eq("product_id", id);
        
        if (oldOptions && oldOptions.length > 0) {
            const optIds = oldOptions.map(o => o.id);
            await c.var.supabase.from("menu_item_option_values").delete().in("option_id", optIds);
            await c.var.supabase.from("menu_item_options").delete().eq("product_id", id);
        }

        for (const opt of body.options) {
            const { data: optionData, error: optError } = await c.var.supabase
                .from("menu_item_options")
                .insert({
                    product_id: id,
                    name: opt.name,
                    is_required: opt.required ?? false,
                    type: opt.type || 'single',
                })
                .select()
                .single();
            
            if (!optError && opt.choices && Array.isArray(opt.choices)) {
                await c.var.supabase
                    .from("menu_item_option_values")
                    .insert(opt.choices.map((choice: any) => ({
                        option_id: optionData.id,
                        name: choice.label,
                        price_adjustment: choice.extra_price || 0,
                    })));
            }
        }
    }

    return c.json({ success: true, product });
});

// ── Product Image Gallery ──────────────────────────────────────────────────────

/** GET /products/:id/images — List extra images for a product */
productsRoutes.get("/:id/images", async (c) => {
    const id = c.req.param("id");

    const { data, error } = await c.var.supabase
        .from("product_images")
        .select("id, url, display_order, created_at")
        .eq("product_id", id)
        .order("display_order");

    if (error) {
        return c.json({ error: "Erreur lors de la récupération des images" }, 500);
    }

    return c.json({ success: true, images: data ?? [] });
});

/** POST /products/:id/images — Add an extra image to a product */
productsRoutes.post("/:id/images", async (c) => {
    const productId = c.req.param("id");
    const body = await c.req.json<{ url: string; display_order?: number }>();

    if (!body.url) {
        return c.json({ error: "URL de l'image requise" }, 400);
    }

    // Verify the product belongs to this restaurant
    const { data: product } = await c.var.supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (!product) {
        return c.json({ error: "Produit introuvable" }, 404);
    }

    const { data, error } = await c.var.supabase
        .from("product_images")
        .insert({ product_id: productId, url: body.url, display_order: body.display_order ?? 0 })
        .select("id, url, display_order, created_at")
        .single();

    if (error || !data) {
        return c.json({ error: "Erreur lors de l'ajout de l'image" }, 500);
    }

    return c.json({ success: true, image: data }, 201);
});

/** PATCH /products/:id/images/:imageId — Update image order */
productsRoutes.patch("/:id/images/:imageId", async (c) => {
    const productId = c.req.param("id");
    const imageId = c.req.param("imageId");
    const body = await c.req.json<{ display_order: number }>();

    // Verify ownership via product→restaurant
    const { data: product } = await c.var.supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (!product) {
        return c.json({ error: "Produit introuvable" }, 404);
    }

    const { data, error } = await c.var.supabase
        .from("product_images")
        .update({ display_order: body.display_order })
        .eq("id", imageId)
        .eq("product_id", productId)
        .select("id, url, display_order")
        .single();

    if (error || !data) {
        return c.json({ error: "Erreur lors de la mise à jour" }, 500);
    }

    return c.json({ success: true, image: data });
});

/** DELETE /products/:id/images/:imageId — Remove an extra image */
productsRoutes.delete("/:id/images/:imageId", async (c) => {
    const productId = c.req.param("id");
    const imageId = c.req.param("imageId");

    // Verify ownership
    const { data: product } = await c.var.supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (!product) {
        return c.json({ error: "Produit introuvable" }, 404);
    }

    const { error } = await c.var.supabase
        .from("product_images")
        .delete()
        .eq("id", imageId)
        .eq("product_id", productId);

    if (error) {
        return c.json({ error: "Erreur lors de la suppression" }, 500);
    }

    return c.json({ success: true });
});

/** DELETE /products/:id */
productsRoutes.delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Foreign keys with CASCADE should handle options/values if configured, 
    // but we have CASCADE on menu_item_options(product_id).
    const { error } = await c.var.supabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId);

    if (error) {
        console.error("Delete product error:", error);
        return c.json({ error: "Erreur lors de la suppression" }, 500);
    }

    return c.json({ success: true });
});
