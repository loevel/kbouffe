/**
 * POST /api/orders/create
 *
 * Creates a dine-in order from the server POS panel.
 *
 * By default (isDraft=false) the order is created with status='pending' and
 * sent directly to the kitchen. When isDraft=true the order is parked as a
 * draft (status='draft') for later recall.
 *
 * Body: {
 *   items:             CartItem[]   — required, non-empty
 *   tableNumber?:      string
 *   tableId?:          string       — UUID FK → tables
 *   covers?:           number       — number of guests
 *   notes?:            string
 *   operatorMemberId?: string       — staff member who took the order
 *   paymentMethod?:    string       — defaults to "cash"
 *   draftLabel?:       string       — human label for parked orders
 *   customerName?:     string       — defaults to tableNumber ?? "Sur place"
 *   isDraft?:          boolean      — park instead of sending to kitchen
 * }
 *
 * CartItem: { id, name, unit_price, quantity, notes? }
 *
 * Returns 201: { success: true, order: { id, status, total, draft_label } }
 *
 * Errors:
 *   400 — validation failure
 *   401 — not authenticated
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

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const body = (await request.json()) as {
      items: CartItem[];
      tableNumber?: string;
      tableId?: string;
      covers?: number;
      notes?: string;
      operatorMemberId?: string;
      paymentMethod?: string;
      draftLabel?: string;
      customerName?: string;
      isDraft?: boolean;
    };

    const {
      items,
      tableNumber,
      tableId,
      covers,
      notes,
      operatorMemberId,
      paymentMethod,
      draftLabel,
      customerName,
      isDraft = false,
    } = body;

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

    // ── Calculate totals ──────────────────────────────────────────────────────
    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const total = subtotal; // no delivery fee for dine-in POS orders

    // ── Generate invoice number ───────────────────────────────────────────────
    // Drafts get a DRF prefix; direct kitchen orders get INV prefix.
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const suffix = Date.now().toString(36).toUpperCase();
    const invoiceNumber = isDraft
      ? `DRF-${yyyymm}-${suffix}`
      : `INV-${yyyymm}-${suffix}`;

    // ── Resolve status and draft metadata ─────────────────────────────────────
    const status = isDraft ? "draft" : "pending";
    const resolvedDraftLabel = isDraft
      ? (draftLabel ?? tableNumber ?? null)
      : null;

    // ── Insert order ──────────────────────────────────────────────────────────
    const { data, error } = await ctx.supabase
      .from("orders")
      .insert({
        restaurant_id: ctx.restaurantId,
        customer_name: customerName ?? tableNumber ?? "Sur place",
        customer_phone: "",
        items: items as any,
        subtotal,
        delivery_fee: 0,
        service_fee: 0,
        corkage_fee: 0,
        tip_amount: 0,
        total,
        status,
        delivery_type: "dine_in",
        payment_method: paymentMethod ?? "cash",
        payment_status: "pending",
        notes: notes ?? null,
        table_number: tableNumber ?? null,
        table_id: tableId ?? null,
        covers: covers ?? null,
        draft_label: resolvedDraftLabel,
        operator_member_id: operatorMemberId ?? null,
        invoice_number: invoiceNumber,
      } as any)
      .select("id, status, total, draft_label, table_number, invoice_number, created_at")
      .single();

    if (error) {
      console.error("Create POS order error:", error);
      return apiError("Erreur lors de la création de la commande");
    }

    return NextResponse.json({ success: true, order: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders/create error:", err);
    return apiError("Erreur serveur");
  }
}
