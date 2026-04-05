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
            name_i18n: body.name_i18n ?? {},
            description_i18n: body.description_i18n ?? {},
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

    const allowedFields = ["name", "description", "is_active", "sort_order", "name_i18n", "description_i18n"];
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
            // ── Boissons — pack complet ──
            { id: "boissons", slug: "boissons", name: "🥤 Boissons (pack complet)", description: "Bières + Sodas + Eaux + Jus + Energisantes (42 produits)" },
            // ── Boissons — catégories individuelles ──
            { id: "boissons_bieres",       slug: "boissons_bieres",       name: "🍺 Bières",                description: "14 bières locales et importées (33 Export, Castel, Mutzig, Kadji...)" },
            { id: "boissons_gazeuses",     slug: "boissons_gazeuses",     name: "🥤 Boissons Gazeuses",    description: "18 sodas et soft drinks (Top, World Cola, Orangina, Razzl, Spécial...)" },
            { id: "boissons_eaux",         slug: "boissons_eaux",         name: "💧 Eaux",                 description: "5 eaux minérales et purifiées (Tangui, Supermont, Vitale, Madiba...)" },
            { id: "boissons_jus",          slug: "boissons_jus",          name: "🍹 Jus Naturels",         description: "5 jus frais artisanaux (Foléré, Gingembre, Baobab, Corossol...)" },
            { id: "boissons_energisantes", slug: "boissons_energisantes", name: "⚡ Boissons Energisantes", description: "Boissons énergisantes (KIQ par UCB)" },
            // ── Cuisine ──
            { id: "braiserie",    slug: "braiserie",    name: "🍖 Braiserie",              description: "Poissons et viandes braisés" },
            { id: "traditionnel", slug: "traditionnel", name: "🥘 Cuisine Traditionnelle", description: "Ndole, Eru, Sauces" },
            { id: "streetfood",   slug: "streetfood",   name: "🌮 Street Food",            description: "Beignets et sandwichs" },
            { id: "petitdej",     slug: "petitdej",     name: "🥐 Petit Déjeuner",         description: "Café, thé, viennoiseries" },
        ];

        return c.json({ packs: builtInPacks });
    } catch (error) {
        console.error("[Available Packs] Exception:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

/** POST /categories/import-pack — Import boilerplate catalog packs from database */

// --- Shared option presets ---
const _volumeBiere = [
    { name: "Format", required: true, choices: [{ label: "Petite (33cl)", extra_price: 0 }, { label: "Grande (65cl)", extra_price: 400 }] },
];
const _temperature = [
    { name: "Température", required: false, choices: [{ label: "Bien fraîche", extra_price: 0 }, { label: "Normale", extra_price: 0 }] },
];
const _volumeSoda = [
    { name: "Format", required: true, choices: [{ label: "Canette (33cl)", extra_price: 0 }, { label: "Bouteille (50cl)", extra_price: 100 }, { label: "Grande (1L)", extra_price: 300 }] },
];
const _volumeEau = [
    { name: "Format", required: true, choices: [{ label: "50cl", extra_price: 0 }, { label: "1L", extra_price: 100 }, { label: "1.5L", extra_price: 200 }, { label: "5L", extra_price: 500 }] },
];
const _taille = [
    { name: "Taille", required: true, choices: [{ label: "Normal", extra_price: 0 }, { label: "Grand", extra_price: 500 }] },
];

const LEGACY_PACKS = {
    boissons: {
        categories: [
            { id: "cat_bieres",       name: "Bières",                description: "Bières locales et importées — Source: boissonsducameroun.com, sa-ucb.com", sort_order: 0, is_active: true },
            { id: "cat_gazeuses",     name: "Boissons Gazeuses",     description: "Sodas et boissons gazeuses — Source: boissonsducameroun.com, sa-ucb.com",  sort_order: 1, is_active: true },
            { id: "cat_eaux",         name: "Eaux",                  description: "Eaux minérales et purifiées — Source: boissonsducameroun.com, sa-ucb.com",  sort_order: 2, is_active: true },
            { id: "cat_jus",          name: "Jus Naturels",          description: "Jus frais et boissons artisanales faits maison",                            sort_order: 3, is_active: true },
            { id: "cat_energisantes", name: "Boissons Energisantes", description: "Boissons énergisantes — Source: sa-ucb.com",                                sort_order: 4, is_active: true },
        ],
        products: [
            // ── Bières ──────────────────────────────────────────────────────
            { category_id: "cat_bieres", name: "33 Export",        description: "Bière blonde lager camerounaise, légère et rafraîchissante. La bière du supporter numéro 1 du football", price: 800,  sort_order: 0,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/33.png",                                                                                          options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Castel Beer",      description: "Bière blonde premium, goût équilibré et amertume subtile. Une référence camerounaise",                              price: 800,  sort_order: 1,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/cantel.png",                                                                                       options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Mutzig",           description: "Bière forte premium au goût prononcé et généreux. L'audace à la camerounaise",                                      price: 900,  sort_order: 2,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/mutsic.png",                                                                                      options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Beaufort Lager",   description: "Bière blonde classique au goût authentique. Le style Beaufort",                                                     price: 700,  sort_order: 3,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/beaufort-lager.png",                                                                                options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Beaufort Light",   description: "Bière légère et moins calorique, pour les moments de détente",                                                      price: 700,  sort_order: 4,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/beaufort-light.png",                                                                               options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Heineken",         description: "Bière blonde internationale premium, qualité constante depuis 1873",                                                price: 1000, sort_order: 5,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/heineken.png",                                                                                     options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Doppel Munich",    description: "Bière brune forte de type Munich, saveurs maltées et caramélisées",                                                 price: 900,  sort_order: 6,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/doppel.png",                                                                                      options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Castle Milk Stout",description: "Bière noire onctueuse aux notes de chocolat et café, douceur unique",                                              price: 1000, sort_order: 7,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/CASTLE-milk-stout-1.webp",                                                                          options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Isenberg",         description: "Bière blonde de type pilsner, fraîche et désaltérante",                                                            price: 800,  sort_order: 8,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/isenberg.png",                                                                                     options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Chill",            description: "Bière blonde légère et rafraîchissante, idéale pour se détendre",                                                  price: 800,  sort_order: 9,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/chill.png",                                                                                       options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Manyan",           description: "Bière traditionnelle camerounaise, goût riche et corsé",                                                           price: 700,  sort_order: 10, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/manyan.png",                                                                                      options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Kadji Beer",       description: "Bière originale 100% maltée, fine, onctueuse et élégante. La référence UCB",                                       price: 800,  sort_order: 11, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/kadji-beer/assets/imgs/Bouteille-kadji-beer.webp",                                                               options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "K44",              description: "Bière blonde ronde et onctueuse, 5% alcool. Premium brassée par UCB",                                             price: 900,  sort_order: 12, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/k44/assets/imgs/k44.webp",                                                                                      options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Bissé",            description: "La bière du partage, 4.7% alcool. Nouvelle sensation brassicole camerounaise",                                    price: 800,  sort_order: 13, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/bisse/assets/imgs/Image-btle-BISSE.png",                                                                         options: [..._volumeBiere, ..._temperature] },

            // ── Boissons Gazeuses ────────────────────────────────────────────
            { category_id: "cat_gazeuses", name: "Top Ananas",              description: "Boisson gazeuse à l'ananas, pétillante et fruitée. Un classique camerounais",              price: 400, sort_order: 0,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-ananas.png",                                                            options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Top Orange",              description: "Boisson gazeuse à l'orange, fraîche et vitaminée",                                          price: 400, sort_order: 1,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-orange.png",                                                            options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Top Grenadine",           description: "Boisson gazeuse à la grenadine, suave et désaltérante",                                     price: 400, sort_order: 2,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-grenadine.png",                                                         options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Top Pamplemousse",        description: "Boisson gazeuse au pamplemousse, acidulée et rafraîchissante",                              price: 400, sort_order: 3,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-pamplemous.png",                                                       options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Top Tonic",               description: "Boisson tonic gazeuse, amertume subtile et bulles fines",                                   price: 400, sort_order: 4,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tonic.png",                                                                options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "World Cola",              description: "Cola camerounais au goût unique, bascule dans un monde rafraîchissant",                     price: 400, sort_order: 5,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/word-cola-50cl.png",                                                       options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Orangina",                description: "Boisson à l'orange avec pulpe, la recette originale pétillante",                           price: 500, sort_order: 6,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/orangina.png",                                                             options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "D'Jino Mangue-Goyave",    description: "Boisson aux fruits tropicaux, saveur mangue et goyave intense",                            price: 400, sort_order: 7,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/07/djino-mangue-goyave-60cl.png",                                               options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Youzou",                  description: "Boisson énergisante et fruitée, dynamique et pétillante",                                   price: 400, sort_order: 8,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/youzou.png",                                                               options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Vinto",                   description: "Boisson au raisin, douce et fruitée avec une touche pétillante",                           price: 400, sort_order: 9,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/vinto.png",                                                               options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Spécial Pamplemousse",    description: "Boisson gazeuse pamplemousse par UCB. Formats cassable 65cl/33cl, PET 1.5L/1L/33cl",      price: 400, sort_order: 10, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20PAMPLEMOUSSE.jpg",                            options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Spécial Orange Passion",  description: "Boisson gazeuse orange passion par UCB. Saveur fruitée et pétillante",                    price: 400, sort_order: 11, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20ORANGE%20PASSION.jpg",                       options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Spécial Cocktail",        description: "Boisson gazeuse cocktail de fruits par UCB. Mélange unique et rafraîchissant",             price: 400, sort_order: 12, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20COCKTAIL.jpg",                              options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Spécial Fruits Rouges",   description: "Boisson gazeuse fruits rouges par UCB. Intense et fruitée",                               price: 400, sort_order: 13, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20FRUITS%20ROUGES.jpg",                         options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Razzl Limonade",          description: "Limonade pétillante Razzl par UCB. 250 FCFA (33cl), 500 FCFA (1L)",                       price: 250, sort_order: 14, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20LIMO.jpg",                                          options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Razzl Orange",            description: "Boisson gazeuse orange Razzl par UCB. Fruitée et accessible",                             price: 250, sort_order: 15, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20ORANGE.jpg",                                        options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Razzl Grenadine",         description: "Boisson gazeuse grenadine Razzl par UCB. Douce et pétillante",                            price: 250, sort_order: 16, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20GRENADINE.jpg",                                     options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Razzl Cola",              description: "Cola Razzl par UCB. Alternative locale et rafraîchissante",                                price: 250, sort_order: 17, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20COLA.jpg",                                          options: _volumeSoda },

            // ── Eaux ─────────────────────────────────────────────────────────
            { category_id: "cat_eaux", name: "Tangui",     description: "Eau minérale naturelle camerounaise, source naturelle de qualité",                                    price: 300, sort_order: 0, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tangui-1l.png",                                                           options: _volumeEau },
            { category_id: "cat_eaux", name: "Supermont",  description: "Eau minérale naturelle plate, pureté et fraîcheur",                                                   price: 300, sort_order: 1, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tangui-13l.png",                                                          options: _volumeEau },
            { category_id: "cat_eaux", name: "Vitale",     description: "Eau purifiée premium, légère et équilibrée en minéraux",                                             price: 250, sort_order: 2, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/vitale.png",                                                              options: _volumeEau },
            { category_id: "cat_eaux", name: "Aqua Belle", description: "Eau de source naturelle filtrée, fraîche et cristalline",                                            price: 250, sort_order: 3, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/aqua-belle.png",                                                           options: _volumeEau },
            { category_id: "cat_eaux", name: "Madiba",     description: "Eau minérale naturelle UCB, puisée en profondeur et distillée 5 fois. Pour un corps sain",           price: 300, sort_order: 4, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/eau-madiba/assets/imgs/MADIBA-0.5L.webp",                                                options: _volumeEau },

            // ── Jus Naturels ─────────────────────────────────────────────────
            { category_id: "cat_jus", name: "Jus de Foléré",      description: "Jus d'hibiscus frais fait maison, rafraîchissant et naturel",          price: 500, sort_order: 0, is_available: false, image_url: null, options: _taille },
            { category_id: "cat_jus", name: "Jus de Gingembre",   description: "Jus de gingembre pimenté, tonifiant et énergisant",                    price: 500, sort_order: 1, is_available: false, image_url: null, options: _taille },
            { category_id: "cat_jus", name: "Jus de Baobab",      description: "Jus de fruit de baobab (bouye), riche en vitamines",                   price: 600, sort_order: 2, is_available: false, image_url: null, options: _taille },
            { category_id: "cat_jus", name: "Jus de Corossol",    description: "Jus onctueux de corossol frais, sucré naturellement",                  price: 700, sort_order: 3, is_available: false, image_url: null, options: _taille },
            { category_id: "cat_jus", name: "Citronnade Maison",  description: "Limonade aux citrons verts frais et menthe",                           price: 400, sort_order: 4, is_available: false, image_url: null, options: _taille },

            // ── Boissons Energisantes ─────────────────────────────────────────
            { category_id: "cat_energisantes", name: "KIQ", description: "Boisson énergisante UCB, formule audacieuse avec vitamines, minéraux et caféine. Lancée en 2024", price: 600, sort_order: 0, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/kiq/assets/imgs/Bottle-768x2388.webp", options: _temperature },
        ]
    },

    // ── Packs individuels par catégorie boisson ──────────────────────────────
    boissons_bieres: {
        categories: [
            { id: "cat_bieres", name: "Bières", description: "Bières locales et importées — Source: boissonsducameroun.com, sa-ucb.com", sort_order: 0, is_active: true },
        ],
        products: [
            { category_id: "cat_bieres", name: "33 Export",         description: "Bière blonde lager camerounaise, légère et rafraîchissante. La bière du supporter numéro 1 du football", price: 800,  sort_order: 0,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/33.png",                                                                    options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Castel Beer",       description: "Bière blonde premium, goût équilibré et amertume subtile. Une référence camerounaise",                              price: 800,  sort_order: 1,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/cantel.png",                                                                 options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Mutzig",            description: "Bière forte premium au goût prononcé et généreux. L'audace à la camerounaise",                                      price: 900,  sort_order: 2,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/mutsic.png",                                                                options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Beaufort Lager",    description: "Bière blonde classique au goût authentique. Le style Beaufort",                                                     price: 700,  sort_order: 3,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/beaufort-lager.png",                                                          options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Beaufort Light",    description: "Bière légère et moins calorique, pour les moments de détente",                                                      price: 700,  sort_order: 4,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/beaufort-light.png",                                                         options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Heineken",          description: "Bière blonde internationale premium, qualité constante depuis 1873",                                                price: 1000, sort_order: 5,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/heineken.png",                                                               options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Doppel Munich",     description: "Bière brune forte de type Munich, saveurs maltées et caramélisées",                                                 price: 900,  sort_order: 6,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/doppel.png",                                                                options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Castle Milk Stout", description: "Bière noire onctueuse aux notes de chocolat et café, douceur unique",                                              price: 1000, sort_order: 7,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/01/CASTLE-milk-stout-1.webp",                                                    options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Isenberg",          description: "Bière blonde de type pilsner, fraîche et désaltérante",                                                            price: 800,  sort_order: 8,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/isenberg.png",                                                               options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Chill",             description: "Bière blonde légère et rafraîchissante, idéale pour se détendre",                                                  price: 800,  sort_order: 9,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/chill.png",                                                                 options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Manyan",            description: "Bière traditionnelle camerounaise, goût riche et corsé",                                                           price: 700,  sort_order: 10, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/02/manyan.png",                                                               options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Kadji Beer",        description: "Bière originale 100% maltée, fine, onctueuse et élégante. La référence UCB",                                       price: 800,  sort_order: 11, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/kadji-beer/assets/imgs/Bouteille-kadji-beer.webp",                                       options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "K44",               description: "Bière blonde ronde et onctueuse, 5% alcool. Premium brassée par UCB",                                             price: 900,  sort_order: 12, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/k44/assets/imgs/k44.webp",                                                              options: [..._volumeBiere, ..._temperature] },
            { category_id: "cat_bieres", name: "Bissé",             description: "La bière du partage, 4.7% alcool. Nouvelle sensation brassicole camerounaise",                                    price: 800,  sort_order: 13, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/bisse/assets/imgs/Image-btle-BISSE.png",                                                 options: [..._volumeBiere, ..._temperature] },
        ]
    },

    boissons_gazeuses: {
        categories: [
            { id: "cat_gazeuses", name: "Boissons Gazeuses", description: "Sodas et boissons gazeuses — Source: boissonsducameroun.com, sa-ucb.com", sort_order: 0, is_active: true },
        ],
        products: [
            { category_id: "cat_gazeuses", name: "Top Ananas",             description: "Boisson gazeuse à l'ananas, pétillante et fruitée. Un classique camerounais",         price: 400, sort_order: 0,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-ananas.png",                                              options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Top Orange",             description: "Boisson gazeuse à l'orange, fraîche et vitaminée",                                     price: 400, sort_order: 1,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-orange.png",                                              options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Top Grenadine",          description: "Boisson gazeuse à la grenadine, suave et désaltérante",                                price: 400, sort_order: 2,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-grenadine.png",                                           options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Top Pamplemousse",       description: "Boisson gazeuse au pamplemousse, acidulée et rafraîchissante",                         price: 400, sort_order: 3,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/top-pamplemous.png",                                        options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Top Tonic",              description: "Boisson tonic gazeuse, amertume subtile et bulles fines",                              price: 400, sort_order: 4,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tonic.png",                                                  options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "World Cola",             description: "Cola camerounais au goût unique, bascule dans un monde rafraîchissant",                price: 400, sort_order: 5,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/word-cola-50cl.png",                                        options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Orangina",               description: "Boisson à l'orange avec pulpe, la recette originale pétillante",                      price: 500, sort_order: 6,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/orangina.png",                                              options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "D'Jino Mangue-Goyave",   description: "Boisson aux fruits tropicaux, saveur mangue et goyave intense",                       price: 400, sort_order: 7,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/07/djino-mangue-goyave-60cl.png",                               options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Youzou",                 description: "Boisson énergisante et fruitée, dynamique et pétillante",                             price: 400, sort_order: 8,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/youzou.png",                                                options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Vinto",                  description: "Boisson au raisin, douce et fruitée avec une touche pétillante",                      price: 400, sort_order: 9,  is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/vinto.png",                                                options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Spécial Pamplemousse",   description: "Boisson gazeuse pamplemousse par UCB. Formats cassable 65cl/33cl, PET 1.5L/1L/33cl", price: 400, sort_order: 10, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20PAMPLEMOUSSE.jpg",             options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Spécial Orange Passion", description: "Boisson gazeuse orange passion par UCB. Saveur fruitée et pétillante",               price: 400, sort_order: 11, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20ORANGE%20PASSION.jpg",          options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Spécial Cocktail",       description: "Boisson gazeuse cocktail de fruits par UCB. Mélange unique et rafraîchissant",        price: 400, sort_order: 12, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20COCKTAIL.jpg",               options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Spécial Fruits Rouges",  description: "Boisson gazeuse fruits rouges par UCB. Intense et fruitée",                          price: 400, sort_order: 13, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20SPECIAL%20BG%20-%20FRUITS%20ROUGES.jpg",           options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Razzl Limonade",         description: "Limonade pétillante Razzl par UCB. 250 FCFA (33cl), 500 FCFA (1L)",                  price: 250, sort_order: 14, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20LIMO.jpg",                            options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Razzl Orange",           description: "Boisson gazeuse orange Razzl par UCB. Fruitée et accessible",                        price: 250, sort_order: 15, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20ORANGE.jpg",                          options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Razzl Grenadine",        description: "Boisson gazeuse grenadine Razzl par UCB. Douce et pétillante",                       price: 250, sort_order: 16, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20GRENADINE.jpg",                       options: _volumeSoda },
            { category_id: "cat_gazeuses", name: "Razzl Cola",             description: "Cola Razzl par UCB. Alternative locale et rafraîchissante",                          price: 250, sort_order: 17, is_available: false, image_url: "https://www.sa-ucb.com/assets/imgs/new/Visuel%20-%20400x500%20-%20RAZZL%20-%20COLA.jpg",                            options: _volumeSoda },
        ]
    },

    boissons_eaux: {
        categories: [
            { id: "cat_eaux", name: "Eaux", description: "Eaux minérales et purifiées — Source: boissonsducameroun.com, sa-ucb.com", sort_order: 0, is_active: true },
        ],
        products: [
            { category_id: "cat_eaux", name: "Tangui",     description: "Eau minérale naturelle camerounaise, source naturelle de qualité",                          price: 300, sort_order: 0, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tangui-1l.png",                                     options: _volumeEau },
            { category_id: "cat_eaux", name: "Supermont",  description: "Eau minérale naturelle plate, pureté et fraîcheur",                                         price: 300, sort_order: 1, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/tangui-13l.png",                                    options: _volumeEau },
            { category_id: "cat_eaux", name: "Vitale",     description: "Eau purifiée premium, légère et équilibrée en minéraux",                                    price: 250, sort_order: 2, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/vitale.png",                                        options: _volumeEau },
            { category_id: "cat_eaux", name: "Aqua Belle", description: "Eau de source naturelle filtrée, fraîche et cristalline",                                   price: 250, sort_order: 3, is_available: false, image_url: "https://boissonsducameroun.com/wp-content/uploads/2024/03/aqua-belle.png",                                    options: _volumeEau },
            { category_id: "cat_eaux", name: "Madiba",     description: "Eau minérale naturelle UCB, puisée en profondeur et distillée 5 fois. Pour un corps sain", price: 300, sort_order: 4, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/eau-madiba/assets/imgs/MADIBA-0.5L.webp",                          options: _volumeEau },
        ]
    },

    boissons_jus: {
        categories: [
            { id: "cat_jus", name: "Jus Naturels", description: "Jus frais et boissons artisanales faits maison", sort_order: 0, is_active: true },
        ],
        products: [
            { category_id: "cat_jus", name: "Jus de Foléré",     description: "Jus d'hibiscus frais fait maison, rafraîchissant et naturel", price: 500, sort_order: 0, is_available: false, image_url: null, options: _taille },
            { category_id: "cat_jus", name: "Jus de Gingembre",  description: "Jus de gingembre pimenté, tonifiant et énergisant",           price: 500, sort_order: 1, is_available: false, image_url: null, options: _taille },
            { category_id: "cat_jus", name: "Jus de Baobab",     description: "Jus de fruit de baobab (bouye), riche en vitamines",          price: 600, sort_order: 2, is_available: false, image_url: null, options: _taille },
            { category_id: "cat_jus", name: "Jus de Corossol",   description: "Jus onctueux de corossol frais, sucré naturellement",         price: 700, sort_order: 3, is_available: false, image_url: null, options: _taille },
            { category_id: "cat_jus", name: "Citronnade Maison", description: "Limonade aux citrons verts frais et menthe",                  price: 400, sort_order: 4, is_available: false, image_url: null, options: _taille },
        ]
    },

    boissons_energisantes: {
        categories: [
            { id: "cat_energisantes", name: "Boissons Energisantes", description: "Boissons énergisantes — Source: sa-ucb.com", sort_order: 0, is_active: true },
        ],
        products: [
            { category_id: "cat_energisantes", name: "KIQ", description: "Boisson énergisante UCB, formule audacieuse avec vitamines, minéraux et caféine. Lancée en 2024", price: 600, sort_order: 0, is_available: false, image_url: "https://www.sa-ucb.com/sous-sites-marque/kiq/assets/imgs/Bottle-768x2388.webp", options: _temperature },
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

        const categoriesToInsert = pack.categories.map((cat: any) => ({
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
                compare_at_price: prod.compare_at_price ?? null,
                is_available: prod.is_available,
                image_url: prod.image_url || null,
                sort_order: prod.sort_order ?? 0,
                options: prod.options ?? null,
            };
        }).filter((p: any) => p !== null);

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
