/**
 * GET /api/store/[slug]/product-feed.xml
 * Generates an XML product feed compatible with Facebook Catalog / Google Merchant Center.
 * The restaurateur copies this URL into their Facebook Commerce Manager to sync
 * their products for Instagram Shopping.
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export async function GET(_request: NextRequest, { params }: Params) {
    const { slug } = await params;
    if (!slug) {
        return new Response("slug requis", { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch restaurant
    const { data: rest, error: restError } = await supabase
        .from("restaurants")
        .select("id, name, slug, description, logo_url")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

    if (restError || !rest) {
        return new Response("Restaurant non trouve", { status: 404 });
    }

    // Fetch all available products with categories
    const { data: products } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, is_available, category_id, categories(name)")
        .eq("restaurant_id", rest.id)
        .eq("is_available", true)
        .order("sort_order");

    const baseUrl = `https://kbouffe.com/r/${rest.slug}`;
    const now = new Date().toISOString();

    const entries = (products ?? [])
        .map(
            (p: any) => `
  <entry>
    <g:id>${escapeXml(p.id)}</g:id>
    <g:title>${escapeXml(p.name)}</g:title>
    <g:description>${escapeXml(p.description || p.name)}</g:description>
    <g:link>${escapeXml(baseUrl)}?product=${escapeXml(p.id)}</g:link>
    <g:image_link>${p.image_url ? escapeXml(p.image_url) : ""}</g:image_link>
    <g:price>${p.price} XAF</g:price>
    <g:availability>${p.is_available ? "in stock" : "out of stock"}</g:availability>
    <g:condition>new</g:condition>
    <g:brand>${escapeXml(rest.name)}</g:brand>
    <g:product_type>${escapeXml(p.categories?.name || "Food &amp; Beverage")}</g:product_type>
  </entry>`
        )
        .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>${escapeXml(rest.name)} — Catalogue</title>
  <link href="${escapeXml(baseUrl)}" rel="alternate" type="text/html"/>
  <updated>${now}</updated>${entries}
</feed>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800, s-maxage=1800",
        },
    });
}
