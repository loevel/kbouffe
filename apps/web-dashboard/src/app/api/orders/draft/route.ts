/**
 * POST /api/orders/draft — Park a new draft order.
 *
 * Creates an order with status='draft'. The draft_label is required
 * (human-readable label like "Table 3 - 4 couverts"). Payment method
 * is optional at this stage (defaults to 'cash') and must be confirmed
 * on recall via PATCH /api/orders/[id]/recall.
 *
 * Park & Recall feature.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const body = await request.json();

    const {
      draftLabel,
      customerName,
      items,
      tableNumber,
      operatorMemberId,
      notes,
      covers,
      payment_method,
    } = body as {
      draftLabel: string;
      customerName?: string;
      items: Array<{
        id: string;
        name?: string;
        quantity?: number;
        qty?: number;
        unit_price?: number;
        price?: number;
      }>;
      tableNumber?: string;
      operatorMemberId?: string;
      notes?: string;
      covers?: number;
      payment_method?: string;
    };

    // ── Validation ───────────────────────────────────────────────────────────
    if (!draftLabel || !draftLabel.trim()) {
      return NextResponse.json(
        { error: "Un libellé de commande garée est requis (ex: Table 3)" },
        { status: 400 }
      );
    }

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
      const qty = Number(item.quantity ?? item.qty ?? 0);
      if (!Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json(
          { error: `Quantité invalide pour l'article ${item.id}` },
          { status: 400 }
        );
      }
      const price = Number(item.unit_price ?? item.price ?? 0);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: `Prix invalide pour l'article ${item.id}` },
          { status: 400 }
        );
      }
    }

    // ── Compute totals ────────────────────────────────────────────────────────
    const subtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity ?? item.qty ?? 1);
      const price = Number(item.unit_price ?? item.price ?? 0);
      return sum + qty * price;
    }, 0);
    const total = subtotal;

    // ── Invoice number (DRF prefix for drafts) ────────────────────────────────
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const invoiceNumber = `DRF-${yyyymm}-${Date.now().toString(36).toUpperCase()}`;

    // ── Insert ────────────────────────────────────────────────────────────────
    const orderData = {
      restaurant_id: ctx.restaurantId,
      customer_name: customerName ?? draftLabel,
      customer_phone: "",
      items,
      subtotal,
      delivery_fee: 0,
      service_fee: 0,
      corkage_fee: 0,
      tip_amount: 0,
      total,
      status: "draft",
      delivery_type: "dine_in",
      payment_method: payment_method ?? "cash",
      payment_status: "pending",
      notes: notes ?? null,
      table_number: tableNumber ?? null,
      covers: covers ?? null,
      draft_label: draftLabel.trim(),
      operator_member_id: operatorMemberId ?? null,
      invoice_number: invoiceNumber,
    };

    const { data, error } = await ctx.supabase
      .from("orders")
      .insert(orderData as any)
      .select("id, draft_label, total, items, table_number, created_at")
      .single();

    if (error) {
      console.error("Create draft order error:", error);
      return apiError("Erreur lors de la création de la commande garée");
    }

    return NextResponse.json({ success: true, order: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders/draft error:", err);
    return apiError("Erreur serveur");
  }
}
