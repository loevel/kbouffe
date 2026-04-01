/**
 * PATCH /api/orders/[id]/items
 *
 * Updates the item list (and optional metadata) of an existing draft order.
 * Used by the server POS panel to edit a parked order before sending it to
 * the kitchen.
 *
 * Body: {
 *   items:       CartItem[]   — required, non-empty
 *   covers?:     number       — number of guests
 *   notes?:      string       — free-text notes for the kitchen
 *   draftLabel?: string       — human-readable label (e.g. "Table 4")
 * }
 *
 * CartItem: { id, name, unit_price, quantity, notes? }
 *
 * Returns: { success: true, order: UpdatedOrder }
 *
 * Errors:
 *   400 — invalid body / order is not a draft
 *   404 — order not found for this restaurant
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

interface CartItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  notes?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;
    const { id: orderId } = await params;

    const body = (await request.json()) as {
      items: CartItem[];
      covers?: number;
      notes?: string;
      draftLabel?: string;
    };

    const { items, covers, notes, draftLabel } = body;

    // ── Validate items ────────────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "La commande doit contenir au moins un article" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json(
          { error: "Chaque article doit avoir un identifiant valide" },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Quantité invalide pour l'article "${item.name ?? item.id}"` },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item.unit_price) || item.unit_price < 0) {
        return NextResponse.json(
          { error: `Prix invalide pour l'article "${item.name ?? item.id}"` },
          { status: 400 }
        );
      }
    }

    // ── Verify order: must exist, belong to this restaurant, and be a draft ──
    const { data: existingOrder, error: fetchError } = await ctx.supabase
      .from("orders")
      .select("id, status, restaurant_id, draft_label")
      .eq("id", orderId)
      .eq("restaurant_id", ctx.restaurantId)
      .maybeSingle();

    if (fetchError) {
      console.error("Items patch — order fetch error:", fetchError);
      return apiError("Erreur lors de la récupération de la commande");
    }

    if (!existingOrder) {
      return apiError("Commande non trouvée ou accès refusé", 404);
    }

    if ((existingOrder as any).status !== "draft") {
      return NextResponse.json(
        {
          error:
            "Seules les commandes garées (brouillons) peuvent être modifiées via cette route",
        },
        { status: 400 }
      );
    }

    // ── Recalculate totals ────────────────────────────────────────────────────
    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const total = subtotal; // no delivery fee for dine-in POS orders

    // ── Persist update ────────────────────────────────────────────────────────
    const { data: updatedOrder, error: updateError } = await ctx.supabase
      .from("orders")
      .update({
        items: items as any,
        subtotal,
        total,
        covers: covers ?? null,
        notes: notes ?? null,
        draft_label:
          draftLabel !== undefined
            ? draftLabel
            : (existingOrder as any).draft_label,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", orderId)
      .eq("restaurant_id", ctx.restaurantId)
      .select(
        "id, status, items, subtotal, total, covers, notes, draft_label, table_number, updated_at"
      )
      .single();

    if (updateError) {
      console.error("Items patch — update error:", updateError);
      return apiError("Erreur lors de la mise à jour des articles de la commande");
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error("PATCH /api/orders/[id]/items error:", err);
    return apiError("Erreur serveur");
  }
}
