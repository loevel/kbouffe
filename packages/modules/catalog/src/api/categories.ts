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

/** GET /categories/available-packs — Get all available catalog packs */
categoriesRoutes.get("/available-packs", async (c) => {
    try {
        // First try to get from database
        const { data, error } = await c.var.supabase
            .from("catalog_packs")
            .select("id, slug, name, description, is_active")
            .eq("is_active", true);

        if (!error && data && data.length > 0) {
            return c.json({ packs: data });
        }

        // Fallback to built-in packs if database is empty
        console.log("[Available Packs] No packs in database, using built-in packs");
        const builtInPacks = [
            { id: "boissons", slug: "boissons", name: "🥤 Boissons", description: "Bières, sodas, jus" },
            { id: "braiserie", slug: "braiserie", name: "🍖 Braiserie", description: "Poissons et viandes braisés" },
            { id: "traditionnel", slug: "traditionnel", name: "🥘 Cuisine Traditionnelle", description: "Ndole, Eru, Sauces" },
            { id: "streetfood", slug: "streetfood", name: "🌮 Street Food", description: "Beignets et sandwichs" },
            { id: "petitdej", slug: "petitdej", name: "🥐 Petit Déjeuner", description: "Café, thé, viennoiseries" },
        ];

        return c.json({ packs: builtInPacks });
    } catch (error) {
        console.error("[Available Packs] Exception:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

/** POST /categories/import-pack — Import boilerplate catalog packs from database */
const LEGACY_PACKS = {
    boissons: {
        categories: [
            { id: "cat_bieres", name: "Bières", description: "Bières locales et importées", sort_order: 1, is_active: true },
            { id: "cat_gazeuses", name: "Boissons Gazeuses", description: "Sodas et boissons gazeuses", sort_order: 2, is_active: true },
            { id: "cat_eaux", name: "Eaux", description: "Eaux minérales et purifiées", sort_order: 3, is_active: true },
            { id: "cat_jus", name: "Jus Naturels", description: "Jus frais et boissons artisanales", sort_order: 4, is_active: true },
        ],
        products: [
            { category_id: "cat_bieres", name: "33 Export", description: "Bière blonde lager", price: 800, is_available: false, image_url: "https://images.unsplash.com/photo-1608270861620-7cf5903d5b07?w=400&h=400&fit=crop" },
            { category_id: "cat_bieres", name: "Castel Beer", description: "Bière blonde premium", price: 800, is_available: false, image_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop" },
            { category_id: "cat_bieres", name: "Mutzig", description: "Bière forte premium", price: 900, is_available: false, image_url: "https://images.unsplash.com/photo-1608270861620-7cf5903d5b07?w=400&h=400&fit=crop" },
            { category_id: "cat_bieres", name: "Beaufort Lager", description: "Bière blonde classique", price: 700, is_available: false, image_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop" },
            { category_id: "cat_bieres", name: "Heineken", description: "Bière internationale premium", price: 1000, is_available: false, image_url: "https://images.unsplash.com/photo-1608270861620-7cf5903d5b07?w=400&h=400&fit=crop" },
            { category_id: "cat_gazeuses", name: "Top Ananas", description: "Boisson gazeuse à l'ananas", price: 400, is_available: false, image_url: "https://images.unsplash.com/photo-1554866585-92c21c93d6f1?w=400&h=400&fit=crop" },
            { category_id: "cat_gazeuses", name: "Top Orange", description: "Boisson gazeuse à l'orange", price: 400, is_available: false, image_url: "https://images.unsplash.com/photo-1599599810694-b5ac4dd5ccf1?w=400&h=400&fit=crop" },
            { category_id: "cat_gazeuses", name: "Top Grenadine", description: "Boisson gazeuse", price: 400, is_available: false, image_url: "https://images.unsplash.com/photo-1554866585-92c21c93d6f1?w=400&h=400&fit=crop" },
            { category_id: "cat_gazeuses", name: "World Cola", description: "Cola", price: 400, is_available: false, image_url: "https://images.unsplash.com/photo-1554866585-92c21c93d6f1?w=400&h=400&fit=crop" },
            { category_id: "cat_gazeuses", name: "Orangina", description: "Boisson à l'orange", price: 500, is_available: false, image_url: "https://images.unsplash.com/photo-1599599810694-b5ac4dd5ccf1?w=400&h=400&fit=crop" },
            { category_id: "cat_eaux", name: "Tangui", description: "Eau minérale naturelle", price: 300, is_available: false, image_url: "https://images.unsplash.com/photo-1610932656061-f1c5b80e267f?w=400&h=400&fit=crop" },
            { category_id: "cat_eaux", name: "Supermont", description: "Eau minérale naturelle plate", price: 300, is_available: false, image_url: "https://images.unsplash.com/photo-1610932656061-f1c5b80e267f?w=400&h=400&fit=crop" },
            { category_id: "cat_eaux", name: "Vitale", description: "Eau purifiée premium", price: 250, is_available: false, image_url: "https://images.unsplash.com/photo-1610932656061-f1c5b80e267f?w=400&h=400&fit=crop" },
            { category_id: "cat_eaux", name: "Aqua Belle", description: "Eau de source", price: 250, is_available: false, image_url: "https://images.unsplash.com/photo-1610932656061-f1c5b80e267f?w=400&h=400&fit=crop" },
            { category_id: "cat_jus", name: "Jus d'Orange Frais", description: "100% pur jus pressé", price: 1200, is_available: false, image_url: "https://images.unsplash.com/photo-1599599810694-b5ac4dd5ccf1?w=400&h=400&fit=crop" },
            { category_id: "cat_jus", name: "Jus d'Ananas Naturel", description: "Jus d'ananas frais de Penja", price: 1000, is_available: false, image_url: "https://images.unsplash.com/photo-1628840042765-356cda07f7d8?w=400&h=400&fit=crop" },
            { category_id: "cat_jus", name: "Foléré", description: "Bissap rouge traditionnel", price: 500, is_available: false, image_url: "https://images.unsplash.com/photo-1600788148184-fb3348f5b50d?w=400&h=400&fit=crop" },
        ]
    },
    braiserie: {
        categories: [
            { id: "cat_poissons", name: "Poissons Braisés", description: "Le meilleur du poisson frais", sort_order: 1, is_active: true },
            { id: "cat_viandes", name: "Viandes & Volaille", description: "Braisés et grillades", sort_order: 2, is_active: true },
            { id: "cat_accompagnements", name: "Accompagnements", description: "Compléments pour vos plats", sort_order: 3, is_active: true },
        ],
        products: [
            { category_id: "cat_poissons", name: "Bar Braisé (Moyen)", description: "Poisson bar frais mariné aux épices", price: 4500, is_available: false, image_url: "https://images.unsplash.com/photo-1669237277313-4b7cf15fb052?w=400&h=400&fit=crop" },
            { category_id: "cat_poissons", name: "Carpe Braisée", description: "Carpe d'eau douce braisée au charbon", price: 3500, is_available: false, image_url: "https://images.unsplash.com/photo-1669237277313-4b7cf15fb052?w=400&h=400&fit=crop" },
            { category_id: "cat_viandes", name: "Demi-Poulet Braisé", description: "Poulet bicyclette tendre et parfumé", price: 4500, is_available: false, image_url: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop" },
            { category_id: "cat_viandes", name: "Soya (Boeuf)", description: "Brochettes de boeuf épicées", price: 2000, is_available: false, image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561e1f?w=400&h=400&fit=crop" },
            { category_id: "cat_accompagnements", name: "Miondo (3 bâtons)", description: "Bâtons de manioc fins", price: 500, is_available: false, image_url: "https://images.unsplash.com/photo-1585238341710-57b0e4bef72e?w=400&h=400&fit=crop" },
            { category_id: "cat_accompagnements", name: "Frites de Plantain", description: "Plantains mûrs frits", price: 1000, is_available: false, image_url: "https://images.unsplash.com/photo-1585238341710-57b0e4bef72e?w=400&h=400&fit=crop" },
        ]
    },
    traditionnel: {
        categories: [
            { id: "cat_sauces", name: "Plats Traditionnels", description: "Recettes ancestrales", sort_order: 1, is_active: true },
            { id: "cat_fufu", name: "Couscous & Fufu", description: "Les bases de nos plats", sort_order: 2, is_active: true },
        ],
        products: [
            { category_id: "cat_sauces", name: "Ndole Complet", description: "Viande, crevettes et morue", price: 3500, is_available: false, image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
            { category_id: "cat_sauces", name: "Eru & Waterleaf", description: "Mélange de légumes verts", price: 3000, is_available: false, image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
            { category_id: "cat_sauces", name: "Sauce Jaune (Achu)", description: "Spécialité du Nord-Ouest", price: 4000, is_available: false, image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
            { category_id: "cat_sauces", name: "Okok Sucré/Salé", description: "Feuilles d'okok et arachide", price: 2500, is_available: false, image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" },
            { category_id: "cat_fufu", name: "Couscous Maïs", description: "Boule de maïs jaune", price: 500, is_available: false, image_url: "https://images.unsplash.com/photo-1476124369162-f4978ffba715?w=400&h=400&fit=crop" },
            { category_id: "cat_fufu", name: "Waterfufu", description: "Fufu de manioc fermenté", price: 500, is_available: false, image_url: "https://images.unsplash.com/photo-1476124369162-f4978ffba715?w=400&h=400&fit=crop" },
        ]
    },
    streetfood: {
        categories: [
            { id: "cat_beignets", name: "Beignets & Snacks", description: "Sur le pouce", sort_order: 1, is_active: true },
            { id: "cat_sandwichs", name: "Sandwichs & Burgers", description: "Le goût de la rue", sort_order: 2, is_active: true },
        ],
        products: [
            { category_id: "cat_beignets", name: "Beignets Haricots", description: "Le classique indémodable", price: 500, is_available: false, image_url: "https://images.unsplash.com/photo-1615673179914-d71ee28c169f?w=400&h=400&fit=crop" },
            { category_id: "cat_beignets", name: "Accras de Morue", description: "Petits beignets de poisson", price: 1000, is_available: false, image_url: "https://images.unsplash.com/photo-1615673179914-d71ee28c169f?w=400&h=400&fit=crop" },
            { category_id: "cat_sandwichs", name: "Pain Chargé", description: "Omelette, spaghetti, avocat", price: 800, is_available: false, image_url: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=400&fit=crop" },
            { category_id: "cat_sandwichs", name: "Burger Maison", description: "Boeuf frais et sauce secrète", price: 2500, is_available: false, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop" },
        ]
    },
    petitdej: {
        categories: [
            { id: "cat_chaud", name: "Boissons Chaudes", description: "Café, Thé et Chocolat", sort_order: 1, is_active: true },
            { id: "cat_pains", name: "Viennoiseries & Pains", description: "Fraîchement cuits", sort_order: 2, is_active: true },
        ],
        products: [
            { category_id: "cat_chaud", name: "Café de l'Ouest", description: "100% Arabica local", price: 1000, is_available: false, image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=400&h=400&fit=crop" },
            { category_id: "cat_chaud", name: "Chocolat Chaud", description: "Cacao du pays", price: 1200, is_available: false, image_url: "https://images.unsplash.com/photo-1578369254639-5f3fb8a7ef1a?w=400&h=400&fit=crop" },
            { category_id: "cat_pains", name: "Pain au Chocolat", description: "Beurre pur", price: 600, is_available: false, image_url: "https://images.unsplash.com/photo-1558636508-e0db3814a4ee?w=400&h=400&fit=crop" },
            { category_id: "cat_pains", name: "Omelette Garnie", description: "3 oeufs, oignons, piment", price: 1500, is_available: false, image_url: "https://images.unsplash.com/photo-1585238341710-57b0e4bef72e?w=400&h=400&fit=crop" },
        ]
    }
};

categoriesRoutes.post("/import-pack", async (c) => {
    try {
        const body = await c.req.json();
        const { packId, restaurantId } = body;

        console.log("[Import Pack] Request:", { packId, restaurantId, authRestaurantId: c.var.restaurantId });

        // Security: ensure merchant is importing for their OWN restaurant
        const targetRestaurantId = restaurantId || c.var.restaurantId;
        if (!targetRestaurantId) {
            console.error("[Import Pack] No restaurant ID found");
            return c.json({ error: "Restaurant non identifié" }, 400);
        }
        if (targetRestaurantId !== c.var.restaurantId) {
            console.error("[Import Pack] Authorization failed", { targetRestaurantId, authRestaurantId: c.var.restaurantId });
            return c.json({ error: "Non autorisé" }, 403);
        }

        if (!packId) return c.json({ error: "packId est requis" }, 400);

        const supabase = c.var.supabase;

        // 1. Get the pack from the database or built-in packs
        let pack: any = null;

        // Try database first
        const { data: packData, error: packError } = await supabase
            .from("catalog_packs")
            .select("*")
            .eq("slug", packId)
            .single();

        if (!packError && packData) {
            pack = {
                categories: packData.categories || [],
                products: packData.products || []
            };
        } else {
            // Fallback to built-in LEGACY_PACKS
            console.log("[Import Pack] Pack not in database, checking built-in packs:", packId);
            pack = LEGACY_PACKS[packId as keyof typeof LEGACY_PACKS];
        }

        if (!pack) {
            console.error("[Import Pack] Pack not found anywhere:", packId);
            return c.json({ error: `Pack "${packId}" non trouvé` }, 404);
        }

        // 1. Insert Categories
        // Map: original_category_id -> category_name (for product matching)
        const categoryIdMap: Record<string, string> = {};
        pack.categories.forEach((cat: any) => {
            categoryIdMap[cat.id] = cat.name;
        });

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
            console.error("[Import Pack] Error inserting categories:", catError);
            return c.json({ error: `Erreur lors de l'importation des catégories: ${catError?.message || "Inconnue"}` }, 500);
        }

        console.log("[Import Pack] Inserted categories:", insertedCategories.length);

        // Create a map: category_name -> category_id for product insertion
        const categoryNameMap: Record<string, string> = {};
        insertedCategories.forEach((cat: any) => {
            categoryNameMap[cat.name] = cat.id;
        });

        // 2. Insert Products
        const productsToInsert = pack.products.map((prod: any) => {
            // Resolve category_id to category_name from the pack
            const categoryName = categoryIdMap[prod.category_id];
            if (!categoryName) {
                console.warn(`[Import Pack] Category not found for product: ${prod.name} (category_id: ${prod.category_id})`);
                return null;
            }
            const categoryId = categoryNameMap[categoryName];
            if (!categoryId) {
                console.warn(`[Import Pack] Inserted category not found: ${categoryName}`);
                return null;
            }
            return {
                restaurant_id: targetRestaurantId,
                category_id: categoryId,
                name: prod.name,
                description: prod.description,
                price: prod.price,
                is_available: prod.is_available,
                image_url: prod.image_url || null,
            };
        }).filter(p => p !== null);

        if (productsToInsert.length > 0) {
            const { error: prodError } = await supabase
                .from('products')
                .insert(productsToInsert as any);

            if (prodError) {
                console.error("[Import Pack] Error inserting products:", prodError);
                return c.json({ error: `Erreur lors de l'importation des produits: ${prodError?.message || "Inconnue"}` }, 500);
            }
            console.log("[Import Pack] Inserted products:", productsToInsert.length);
        }

        console.log("[Import Pack] Success! Pack imported:", packId);
        return c.json({ success: true, message: "Pack importé avec succès" });
    } catch (error) {
        console.error("Import Pack API Error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});
