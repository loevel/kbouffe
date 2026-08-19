import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL, STATIC_ROUTES } from "@/lib/seo/site";

// Le catalogue de restaurants bouge en continu : on interroge la base à chaque
// requête plutôt que de figer le sitemap au build (le build n'a pas forcément
// accès à Supabase, et un sitemap n'est demandé que par les robots).
export const dynamic = "force-dynamic";

const MAX_RESTAURANTS = 5000; // limite du protocole : 50 000 URLs par sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
        url: `${SITE_URL}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    let restaurantEntries: MetadataRoute.Sitemap = [];
    try {
        const supabase = await createClient();
        // Même filtre que la liste publique /api/stores : seules les vitrines
        // réellement en ligne sont proposées à l'indexation.
        const { data, error } = await supabase
            .from("restaurants")
            .select("slug, updated_at")
            .eq("is_published", true)
            .order("updated_at", { ascending: false })
            .limit(MAX_RESTAURANTS);

        if (error) throw error;

        restaurantEntries = (data ?? [])
            .filter((row) => Boolean(row?.slug))
            .map((row) => ({
                url: `${SITE_URL}/r/${row.slug}`,
                lastModified: row.updated_at ? new Date(row.updated_at) : now,
                changeFrequency: "weekly" as const,
                priority: 0.8,
            }));
    } catch (err) {
        // Un sitemap partiel vaut mieux qu'une 500 : les pages statiques restent
        // servies même si Supabase est indisponible.
        console.error("[sitemap] Impossible de lister les restaurants:", err);
    }

    return [...staticEntries, ...restaurantEntries];
}
