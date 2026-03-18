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
