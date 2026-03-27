import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminCatalogRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Categories ──────────────────────────────────────────────────
adminCatalogRoutes.get("/categories", async (c) => {
    const denied = requireDomain(c, "catalog:read");
    if (denied) return denied;

    const restaurantId = c.req.query("restaurantId");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    
    let query = supabase.from("categories").select("*, restaurant:restaurants(name)");

    if (restaurantId) {
        query = query.eq("restaurant_id", restaurantId);
    }

    const { data, error } = await query.order("sort_order", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data });
});

adminCatalogRoutes.post("/categories", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const body = await c.req.json();
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data, error } = await supabase
        .from("categories")
        .insert({ ...body, created_at: new Date().toISOString() })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "create_catalog_category",
        targetType: "category",
        targetId: data.id,
        details: body
    });

    return c.json({ success: true, data });
});

adminCatalogRoutes.patch("/categories/:id", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json();
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data, error } = await supabase
        .from("categories")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "update_catalog_category",
        targetType: "category",
        targetId: id,
        details: body
    });

    return c.json({ success: true, data });
});

adminCatalogRoutes.delete("/categories/:id", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "delete_catalog_category",
        targetType: "category",
        targetId: id
    });

    return c.json({ success: true });
});

// ── Products ────────────────────────────────────────────────────
adminCatalogRoutes.get("/products", async (c) => {
    const denied = requireDomain(c, "catalog:read");
    if (denied) return denied;

    const restaurantId = c.req.query("restaurantId");
    const categoryId = c.req.query("categoryId");
    const q = c.req.query("q") ?? "";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    
    let query = supabase
        .from("products")
        .select("*, category:categories(name), restaurant:restaurants(name)", { count: "exact" });

    if (restaurantId) query = query.eq("restaurant_id", restaurantId);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (q) query = query.ilike("name", `%${q}%`);

    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) return c.json({ error: error.message }, 500);

    return c.json({
        data,
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / limit)
        }
    });
});

adminCatalogRoutes.post("/products", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const body = await c.req.json();
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data, error } = await supabase
        .from("products")
        .insert({ ...body, created_at: new Date().toISOString() })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "create_catalog_product",
        targetType: "product",
        targetId: data.id,
        details: body
    });

    return c.json({ success: true, data });
});

adminCatalogRoutes.patch("/products/:id", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json();
    
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data, error } = await supabase
        .from("products")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "update_catalog_product",
        targetType: "product",
        targetId: id,
        details: body
    });

    return c.json({ success: true, data });
});

adminCatalogRoutes.delete("/products/:id", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "delete_catalog_product",
        targetType: "product",
        targetId: id
    });

    return c.json({ success: true });
});

// ── Import Pack ───────────────────────────────────────────────
const PACKS = {
    braiserie: {
        categories: [
            { id: "cat_poissons", name: "Poissons Braisés", description: "Le meilleur du poisson frais", sort_order: 1, is_active: true },
            { id: "cat_viandes", name: "Viandes & Volaille", description: "Braisés et grillades", sort_order: 2, is_active: true },
            { id: "cat_accompagnements", name: "Accompagnements", description: "Compléments pour vos plats", sort_order: 3, is_active: true },
        ],
        products: [
            { category_id: "cat_poissons", name: "Bar Braisé (Moyen)", description: "Poisson bar frais mariné aux épices", price: 4500, is_available: true },
            { category_id: "cat_poissons", name: "Carpe Braisée", description: "Carpe d'eau douce braisée au charbon", price: 3500, is_available: true },
            { category_id: "cat_viandes", name: "Demi-Poulet Braisé", description: "Poulet bicyclette tendre et parfumé", price: 4500, is_available: true },
            { category_id: "cat_viandes", name: "Soya (Boeuf)", description: "Brochettes de boeuf épicées", price: 2000, is_available: true },
            { category_id: "cat_accompagnements", name: "Miondo (3 bâtons)", description: "Bâtons de manioc fins", price: 500, is_available: true },
            { category_id: "cat_accompagnements", name: "Frites de Plantain", description: "Plantains mûrs frits", price: 1000, is_available: true },
        ]
    },
    traditionnel: {
        categories: [
            { id: "cat_sauces", name: "Plats Traditionnels", description: "Recettes ancestrales", sort_order: 1, is_active: true },
            { id: "cat_fufu", name: "Couscous & Fufu", description: "Les bases de nos plats", sort_order: 2, is_active: true },
        ],
        products: [
            { category_id: "cat_sauces", name: "Ndole Complet", description: "Viande, crevettes et morue", price: 3500, is_available: true },
            { category_id: "cat_sauces", name: "Eru & Waterleaf", description: "Mélange de légumes verts", price: 3000, is_available: true },
            { category_id: "cat_sauces", name: "Sauce Jaune (Achu)", description: "Spécialité du Nord-Ouest", price: 4000, is_available: true },
            { category_id: "cat_sauces", name: "Okok Sucré/Salé", description: "Feuilles d'okok et arachide", price: 2500, is_available: true },
            { category_id: "cat_fufu", name: "Couscous Maïs", description: "Boule de maïs jaune", price: 500, is_available: true },
            { category_id: "cat_fufu", name: "Waterfufu", description: "Fufu de manioc fermenté", price: 500, is_available: true },
        ]
    },
    streetfood: {
        categories: [
            { id: "cat_beignets", name: "Beignets & Snacks", description: "Sur le pouce", sort_order: 1, is_active: true },
            { id: "cat_sandwichs", name: "Sandwichs & Burgers", description: "Le goût de la rue", sort_order: 2, is_active: true },
        ],
        products: [
            { category_id: "cat_beignets", name: "Beignets Haricots", description: "Le classique indémodable", price: 500, is_available: true },
            { category_id: "cat_beignets", name: "Accras de Morue", description: "Petits beignets de poisson", price: 1000, is_available: true },
            { category_id: "cat_sandwichs", name: "Pain Chargé", description: "Omelette, spaghetti, avocat", price: 800, is_available: true },
            { category_id: "cat_sandwichs", name: "Burger Maison", description: "Boeuf frais et sauce secrète", price: 2500, is_available: true },
        ]
    },
    petitdej: {
        categories: [
            { id: "cat_chaud", name: "Boissons Chaudes", description: "Café, Thé et Chocolat", sort_order: 1, is_active: true },
            { id: "cat_pains", name: "Viennoiseries & Pains", description: "Fraîchement cuits", sort_order: 2, is_active: true },
        ],
        products: [
            { category_id: "cat_chaud", name: "Café de l'Ouest", description: "100% Arabica local", price: 1000, is_available: true },
            { category_id: "cat_chaud", name: "Chocolat Chaud", description: "Cacao du pays", price: 1200, is_available: true },
            { category_id: "cat_pains", name: "Pain au Chocolat", description: "Beurre pur", price: 600, is_available: true },
            { category_id: "cat_pains", name: "Omelette Garnie", description: "3 oeufs, oignons, piment", price: 1500, is_available: true },
        ]
    },
    boissons: {
        categories: [
            { id: "cat_bieres", name: "Bières", description: "Bières locales et importées", sort_order: 1, is_active: true },
            { id: "cat_gazeuses", name: "Boissons Gazeuses", description: "Sodas et boissons gazeuses", sort_order: 2, is_active: true },
            { id: "cat_jus", name: "Jus Naturels", description: "Jus frais et boissons artisanales", sort_order: 3, is_active: true },
        ],
        products: [
            { category_id: "cat_bieres", name: "33 Export (65cl)", description: "Bière blonde lager", price: 800, is_available: true },
            { category_id: "cat_bieres", name: "Castel Beer (65cl)", description: "Bière blonde premium", price: 800, is_available: true },
            { category_id: "cat_gazeuses", name: "Top Ananas", description: "Boisson gazeuse à l'ananas", price: 500, is_available: true },
            { category_id: "cat_jus", name: "Foléré Maison", description: "Bissap rouge gingembre", price: 500, is_available: true },
            { category_id: "cat_jus", name: "Jus de Baobab", description: "Onctueux et nutritif", price: 800, is_available: true },
        ]
    }
};

adminCatalogRoutes.post("/categories/import-pack", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    try {
        const body = await c.req.json();
        const { packId, restaurantId } = body;

        if (!restaurantId) return c.json({ error: "restaurantId est requis" }, 400);
        if (!packId) return c.json({ error: "packId est requis" }, 400);

        const pack = PACKS[packId as keyof typeof PACKS];
        if (!pack) return c.json({ error: "Pack non trouvé" }, 404);

        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

        // 1. Insert Categories
        const categoriesToInsert = pack.categories.map(cat => ({
            restaurant_id: restaurantId,
            name: cat.name,
            description: cat.description,
            sort_order: cat.sort_order,
            is_active: cat.is_active,
            created_at: new Date().toISOString()
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
            restaurant_id: restaurantId,
            category_id: categoryIdMap[prod.category_id],
            name: prod.name,
            description: prod.description,
            price: prod.price,
            is_available: prod.is_available,
            created_at: new Date().toISOString()
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

        await logAdminAction(c, {
            action: "import_catalog_pack",
            targetType: "restaurant",
            targetId: restaurantId,
            details: { packId }
        });

        return c.json({ success: true, message: "Pack importé avec succès" });
    } catch (error) {
        console.error("Import Pack Admin API Error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── Cuisine Categories (platform-level filters) ──────────────────
adminCatalogRoutes.get("/cuisine-categories", async (c) => {
    const denied = requireDomain(c, "catalog:read");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data, error } = await supabase
        .from("cuisine_categories")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data: data ?? [] });
});

adminCatalogRoutes.post("/cuisine-categories", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const body = await c.req.json();
    const { label, value, icon, sort_order, is_active } = body;

    if (!label || !value || !icon) {
        return c.json({ error: "label, value et icon sont requis" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data, error } = await supabase
        .from("cuisine_categories")
        .insert({
            label,
            value,
            icon,
            sort_order: sort_order ?? 0,
            is_active: is_active ?? true,
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "create_cuisine_category",
        targetType: "cuisine_category",
        targetId: data.id,
        details: { label, value, icon },
    });

    return c.json({ success: true, data });
});

adminCatalogRoutes.patch("/cuisine-categories/:id", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json();
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data, error } = await supabase
        .from("cuisine_categories")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "update_cuisine_category",
        targetType: "cuisine_category",
        targetId: id,
        details: body,
    });

    return c.json({ success: true, data });
});

adminCatalogRoutes.delete("/cuisine-categories/:id", async (c) => {
    const denied = requireDomain(c, "catalog:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { error } = await supabase
        .from("cuisine_categories")
        .delete()
        .eq("id", id);

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "delete_cuisine_category",
        targetType: "cuisine_category",
        targetId: id,
    });

    return c.json({ success: true });
});
