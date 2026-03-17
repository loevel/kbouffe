/**
 * Categories routes — migrated from web-dashboard/src/app/api/categories/
 *
 * GET    /categories          — List categories
 * POST   /categories          — Create a category
 * PATCH  /categories/:id      — Update a category
 * DELETE /categories/:id      — Delete a category
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const categoriesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /categories */
categoriesRoutes.get("/", async (c) => {
    const { data, error } = await c.var.supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Categories query error:", error);
        return c.json({ error: "Erreur lors de la récupération des catégories" }, 500);
    }

    return c.json({ categories: data ?? [] });
});

/** POST /categories */
categoriesRoutes.post("/", async (c) => {
    const body = await c.req.json();
    if (!body.name?.trim()) return c.json({ error: "Le nom de la catégorie est requis" }, 400);

    const { data: lastCat } = await c.var.supabase
        .from("categories")
        .select("sort_order")
        .eq("restaurant_id", c.var.restaurantId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

    const { data, error } = await c.var.supabase
        .from("categories")
        .insert({
            restaurant_id: c.var.restaurantId,
            name: body.name.trim(),
            description: body.description?.trim() || null,
            is_active: body.is_active ?? true,
            sort_order: ((lastCat as any)?.sort_order ?? 0) + 1,
        } as any)
        .select()
        .single();

    if (error) {
        console.error("Create category error:", error);
        return c.json({ error: "Erreur lors de la création de la catégorie" }, 500);
    }

    return c.json({ success: true, category: data }, 201);
});

/** PATCH /categories/:id */
categoriesRoutes.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    const allowedFields = ["name", "description", "is_active", "sort_order"];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) updateData[field] = body[field];
    }

    const { data, error } = await c.var.supabase
        .from("categories")
        .update(updateData as any)
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .select()
        .single();

    if (error) {
        console.error("Update category error:", error);
        return c.json({ error: "Erreur lors de la mise à jour" }, 500);
    }

    return c.json({ success: true, category: data });
});

/** DELETE /categories/:id */
categoriesRoutes.delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Detach products from this category
    await c.var.supabase
        .from("products")
        .update({ category_id: null } as any)
        .eq("category_id", id)
        .eq("restaurant_id", c.var.restaurantId);

    const { error } = await c.var.supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId);

    if (error) {
        console.error("Delete category error:", error);
        return c.json({ error: "Erreur lors de la suppression" }, 500);
    }

    return c.json({ success: true });
});

/** POST /categories/import-pack — Import boilerplate catalog packs */
const PACKS = {
    boissons: {
        categories: [
            { id: "cat_bieres", name: "Bières", description: "Bières locales et importées", sort_order: 1, is_active: true },
            { id: "cat_gazeuses", name: "Boissons Gazeuses", description: "Sodas et boissons gazeuses", sort_order: 2, is_active: true },
            { id: "cat_eaux", name: "Eaux", description: "Eaux minérales et purifiées", sort_order: 3, is_active: true },
            { id: "cat_jus", name: "Jus Naturels", description: "Jus frais et boissons artisanales", sort_order: 4, is_active: true },
        ],
        products: [
            { category_id: "cat_bieres", name: "33 Export", description: "Bière blonde lager", price: 800, is_available: false },
            { category_id: "cat_bieres", name: "Castel Beer", description: "Bière blonde premium", price: 800, is_available: false },
            { category_id: "cat_bieres", name: "Mutzig", description: "Bière forte premium", price: 900, is_available: false },
            { category_id: "cat_bieres", name: "Beaufort Lager", description: "Bière blonde classique", price: 700, is_available: false },
            { category_id: "cat_bieres", name: "Heineken", description: "Bière internationale premium", price: 1000, is_available: false },
            { category_id: "cat_gazeuses", name: "Top Ananas", description: "Boisson gazeuse à l'ananas", price: 400, is_available: false },
            { category_id: "cat_gazeuses", name: "Top Orange", description: "Boisson gazeuse à l'orange", price: 400, is_available: false },
            { category_id: "cat_gazeuses", name: "Top Grenadine", description: "Boisson gazeuse", price: 400, is_available: false },
            { category_id: "cat_gazeuses", name: "World Cola", description: "Cola", price: 400, is_available: false },
            { category_id: "cat_gazeuses", name: "Orangina", description: "Boisson à l'orange", price: 500, is_available: false },
            { category_id: "cat_eaux", name: "Tangui", description: "Eau minérale naturelle", price: 300, is_available: false },
            { category_id: "cat_eaux", name: "Supermont", description: "Eau minérale naturelle plate", price: 300, is_available: false },
            { category_id: "cat_eaux", name: "Vitale", description: "Eau purifiée premium", price: 250, is_available: false },
            { category_id: "cat_eaux", name: "Aqua Belle", description: "Eau de source", price: 250, is_available: false },
            { category_id: "cat_jus", name: "Jus d'Orange Frais", description: "100% pur jus pressé", price: 1200, is_available: false },
            { category_id: "cat_jus", name: "Jus d'Ananas Naturel", description: "Jus d'ananas frais de Penja", price: 1000, is_available: false },
            { category_id: "cat_jus", name: "Foléré", description: "Bissap rouge traditionnel", price: 500, is_available: false },
        ]
    }
};

categoriesRoutes.post("/import-pack", async (c) => {
    try {
        const body = await c.req.json();
        const { packId, restaurantId } = body;

        // Security: ensure merchant is importing for their OWN restaurant
        const targetRestaurantId = restaurantId || c.var.restaurantId;
        if (targetRestaurantId !== c.var.restaurantId) {
             return c.json({ error: "Non autorisé" }, 403);
        }

        if (!packId) return c.json({ error: "packId est requis" }, 400);

        const pack = PACKS[packId as keyof typeof PACKS];
        if (!pack) return c.json({ error: "Pack non trouvé" }, 404);

        const supabase = c.var.supabase;

        // 1. Insert Categories
        const categoriesToInsert = pack.categories.map(cat => ({
            restaurant_id: targetRestaurantId,
            name: cat.name,
            description: cat.description,
            sort_order: cat.sort_order,
            is_active: cat.is_active
        }));

        const { data: insertedCategories, error: catError } = await supabase
            .from('categories')
            .insert(categoriesToInsert)
            .select();

        if (catError || !insertedCategories) {
            console.error("Error inserting categories:", catError);
            return c.json({ error: "Échec de l'importation des catégories" }, 500);
        }

        const categoryIdMap: Record<string, string> = {};
        pack.categories.forEach((catTemplate: any) => {
            const inserted = insertedCategories.find(c => c.name === catTemplate.name);
            if (inserted) {
                categoryIdMap[catTemplate.id] = inserted.id;
            }
        });

        // 2. Insert Products
        const productsToInsert = pack.products.map(prod => ({
            restaurant_id: targetRestaurantId,
            category_id: categoryIdMap[prod.category_id],
            name: prod.name,
            description: prod.description,
            price: prod.price,
            is_available: prod.is_available,
        })).filter(p => p.category_id);

        if (productsToInsert.length > 0) {
            const { error: prodError } = await supabase
                .from('products')
                .insert(productsToInsert as any);

            if (prodError) {
                console.error("Error inserting products:", prodError);
                return c.json({ error: "Échec de l'importation des produits" }, 500);
            }
        }

        return c.json({ success: true, message: "Pack importé avec succès" });
    } catch (error) {
        console.error("Import Pack API Error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});
