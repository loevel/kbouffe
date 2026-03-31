/**
 * GET /api/export/restaurant
 * Exports all data belonging to the authenticated restaurant as a JSON file.
 * GDPR Article 20 — Right to data portability.
 *
 * Includes: restaurant info, products, categories, orders (all),
 *           order items, reviews, team members.
 * Excludes: other restaurants' data, platform secrets.
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";

export async function GET() {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;
    const db = supabase as any;

    try {
        // Fetch all data in parallel
        const [
            restaurantRes,
            productsRes,
            categoriesRes,
            ordersRes,
            reviewsRes,
            teamRes,
        ] = await Promise.all([
            db.from("restaurants")
                .select("id, name, description, address, phone, email, cuisine_type, created_at")
                .eq("id", restaurantId)
                .single(),

            db.from("products")
                .select("id, name, description, price, category_id, is_available, created_at")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false }),

            db.from("categories")
                .select("id, name, description, sort_order")
                .eq("restaurant_id", restaurantId)
                .order("sort_order"),

            db.from("orders")
                .select(`
                    id, status, delivery_type, total_amount, delivery_fee,
                    special_instructions, created_at, updated_at,
                    order_items(id, product_id, quantity, unit_price, total_price, notes)
                `)
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false }),

            db.from("reviews")
                .select("id, rating, comment, created_at")
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false }),

            db.from("restaurant_members")
                .select("id, role, status, created_at")
                .eq("restaurant_id", restaurantId),
        ]);

        const exportData = {
            export_metadata: {
                version: "1.0",
                exported_at: new Date().toISOString(),
                restaurant_id: restaurantId,
                platform: "kBouffe",
                gdpr_note: "Export conforme RGPD — Article 20 portabilité des données.",
            },
            restaurant: restaurantRes.data ?? null,
            statistics: {
                total_products: productsRes.data?.length ?? 0,
                total_categories: categoriesRes.data?.length ?? 0,
                total_orders: ordersRes.data?.length ?? 0,
                total_reviews: reviewsRes.data?.length ?? 0,
                team_members: teamRes.data?.length ?? 0,
            },
            products: productsRes.data ?? [],
            categories: categoriesRes.data ?? [],
            orders: ordersRes.data ?? [],
            reviews: reviewsRes.data ?? [],
            team: teamRes.data ?? [],
        };

        const restaurantName = (restaurantRes.data?.name ?? "restaurant")
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const date = new Date().toISOString().split("T")[0];
        const filename = `kbouffe-export-${restaurantName}-${date}.json`;

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "X-Export-Rows": String(
                    (productsRes.data?.length ?? 0) +
                    (ordersRes.data?.length ?? 0) +
                    (reviewsRes.data?.length ?? 0)
                ),
            },
        });
    } catch (err) {
        console.error("[GET /api/export/restaurant]", err);
        return NextResponse.json({ error: "Erreur lors de la génération de l'export" }, { status: 500 });
    }
}
