/**
 * GET /api/store/[slug]/manifest.json
 * Dynamic PWA manifest — white-label per restaurant.
 * Returns the restaurant's name, logo, and primary color so the installed PWA
 * looks like a standalone app for that specific restaurant.
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
    const { slug } = await params;
    if (!slug) {
        return new Response("slug requis", { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data: rest, error } = await supabase
        .from("restaurants")
        .select("name, description, slug, logo_url, primary_color")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

    if (error || !rest) {
        return new Response("Restaurant non trouve", { status: 404 });
    }

    const themeColor = rest.primary_color ?? "#f97316";
    const startUrl = `/r/${rest.slug}`;

    const manifest = {
        id: startUrl,
        name: rest.name,
        short_name: rest.name.length > 12 ? rest.name.slice(0, 12) : rest.name,
        description: rest.description ?? `Commandez en ligne chez ${rest.name}`,
        start_url: startUrl,
        scope: startUrl,
        display: "standalone" as const,
        orientation: "portrait" as const,
        lang: "fr",
        background_color: "#ffffff",
        theme_color: themeColor,
        categories: ["food", "shopping"],
        icons: rest.logo_url
            ? [
                  {
                      src: rest.logo_url,
                      sizes: "192x192",
                      type: "image/png",
                  },
                  {
                      src: rest.logo_url,
                      sizes: "512x512",
                      type: "image/png",
                      purpose: "any maskable",
                  },
              ]
            : [
                  {
                      src: "/logo-icon.svg",
                      sizes: "any",
                      type: "image/svg+xml",
                  },
              ],
    };

    return new Response(JSON.stringify(manifest, null, 2), {
        headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
    });
}
