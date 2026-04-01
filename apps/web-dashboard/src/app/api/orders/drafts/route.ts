/**
 * GET /api/orders/drafts — List all parked (draft) orders for the restaurant.
 *
 * This route MUST exist as a dedicated file so that Next.js resolves it as a
 * static segment (priority over the dynamic /api/orders/[id] route).
 *
 * Park & Recall feature.
 */
import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET() {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const { data, error } = await ctx.supabase
      .from("orders")
      .select("id, customer_name, total, table_number, created_at, items")
      .eq("restaurant_id", ctx.restaurantId)
      .eq("status", "draft" as any)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Drafts query error:", error);
      return apiError("Erreur lors de la récupération des commandes garées");
    }

    const drafts = (data ?? []).map((row: any) => ({
      id: row.id,
      draft_label: row.draft_label ?? null,
      operator_member_id: row.operator_member_id ?? null,
      customer_name: row.customer_name,
      table_number: row.table_number,
      total: row.total,
      items_count: Array.isArray(row.items) ? (row.items as unknown[]).length : 0,
      created_at: row.created_at,
    }));

    return NextResponse.json({ drafts });
  } catch (err) {
    console.error("GET /api/orders/drafts error:", err);
    return apiError("Erreur serveur");
  }
}
