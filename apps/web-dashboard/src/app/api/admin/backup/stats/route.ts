/**
 * GET /api/admin/backup/stats
 * Returns row counts per table for the backup dashboard.
 */
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

const TABLES = [
    "restaurants", "users", "orders", "order_items",
    "products", "categories", "reviews",
    "marketplace_purchases", "marketplace_services",
    "platform_integrations", "social_accounts", "social_posts",
];

export async function GET() {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    try {
        const counts = await Promise.all(
            TABLES.map(async (table) => {
                const { count, error } = await db
                    .from(table)
                    .select("*", { count: "exact", head: true });
                return { table, count: error ? null : (count ?? 0) };
            })
        );

        const totalRows = counts.reduce((sum, c) => sum + (c.count ?? 0), 0);

        return NextResponse.json({
            tables: counts,
            total_rows: totalRows,
            checked_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error("[GET /api/admin/backup/stats]", err);
        return NextResponse.json({ error: "Erreur" }, { status: 500 });
    }
}
