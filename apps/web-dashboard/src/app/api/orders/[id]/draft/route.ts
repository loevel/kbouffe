/**
 * DELETE /api/orders/[id]/draft — Discard a parked order.
 *
 * Sets status to 'cancelled' (preserves audit trail).
 * Only works on orders with status='draft'.
 *
 * Park & Recall feature.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;
    const { id } = await params;

    const admin = await createAdminClient();

    // 1. Verify the order exists, belongs to restaurant, and is a draft
    const { data: order, error: fetchError } = await admin
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (fetchError || !order) {
      return apiError("Commande non trouvée", 404);
    }

    if ((order as any).status !== "draft") {
      return NextResponse.json(
        { error: "Seules les commandes garées peuvent être supprimées via cette route" },
        { status: 400 }
      );
    }

    // 2. Set to cancelled (audit trail preserved — no hard delete)
    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: "cancelled" as any,
        draft_label: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId);

    if (updateError) {
      console.error("Discard draft error:", updateError);
      return apiError("Erreur lors de la suppression de la commande garée");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/orders/[id]/draft error:", err);
    return apiError("Erreur serveur");
  }
}
