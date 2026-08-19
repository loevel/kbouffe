import type { MetadataRoute } from "next";
import {
    CRAWLABLE_API_PATHS,
    DISALLOWED_PATHS,
    PRIVATE_API_PATHS,
    SITE_URL,
} from "@/lib/seo/site";

/**
 * /robots.txt — servi sur le domaine principal.
 * admin.kbouffe.com et les sous-domaines restaurant sont traités séparément
 * dans le proxy (lib/supabase/middleware.ts), qui réécrit leurs chemins.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", ...CRAWLABLE_API_PATHS],
                disallow: [...DISALLOWED_PATHS, ...PRIVATE_API_PATHS],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
