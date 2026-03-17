/**
 * POST /api/store/order
 * Crée une commande client (route publique — pas d'auth requise).
 * Utilisée depuis la vitrine /r/[slug] (web) et potentiellement le mobile.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const ALLOWED_DELIVERY_TYPES = ["delivery", "pickup", "dine_in"] as const;
const ALLOWED_PAYMENT_METHODS = ["cash", "mobile_money_mtn", "mobile_money_orange"] as const;

type DeliveryType = (typeof ALLOWED_DELIVERY_TYPES)[number];
type PaymentMethod = (typeof ALLOWED_PAYMENT_METHODS)[number];

interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

interface OrderBody {
    restaurantId: string;
    items: OrderItem[];
    deliveryType: DeliveryType;
    deliveryAddress?: string;
    tableNumber?: string;
    customerName: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    subtotal: number;
    deliveryFee: number;
    total: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: OrderBody = await request.json();

        // ── Validation ─────────────────────────────────────────────────────
        if (!body.restaurantId) {
            return NextResponse.json({ error: "restaurantId requis" }, { status: 400 });
        }
        if (!body.items?.length) {
            return NextResponse.json({ error: "La commande doit contenir au moins un article" }, { status: 400 });
        }
        if (!body.customerName?.trim()) {
            return NextResponse.json({ error: "customerName requis" }, { status: 400 });
        }
        if (!body.customerPhone?.trim()) {
            return NextResponse.json({ error: "customerPhone requis" }, { status: 400 });
        }
        if (!ALLOWED_DELIVERY_TYPES.includes(body.deliveryType)) {
            return NextResponse.json({ error: "deliveryType invalide" }, { status: 400 });
        }
        if (!ALLOWED_PAYMENT_METHODS.includes(body.paymentMethod)) {
            return NextResponse.json({ error: "paymentMethod invalide" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // ── Insert order ───────────────────────────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: order, error: orderError } = await supabase
            .from("orders")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert({
                restaurant_id: body.restaurantId,
                customer_id: null, // guest order (pas de compte requis)
                customer_name: body.customerName.trim(),
                customer_phone: body.customerPhone.trim(),
                items: body.items,
                subtotal: body.subtotal,
                delivery_fee: body.deliveryFee,
                service_fee: 0,
                corkage_fee: 0,
                tip_amount: 0,
                total: body.total,
                status: "pending",
                delivery_type: body.deliveryType,
                delivery_address: body.deliveryAddress ?? null,
                payment_method: body.paymentMethod,
                payment_status: "pending",
                notes: null,
                table_number: body.tableNumber ?? null,
                table_id: null,
                covers: null,
                external_drinks_count: 0,
            } as any)
            .select("id")
            .single();

        if (orderError) {
            console.error("[POST /api/store/order] Supabase error:", orderError);
            return NextResponse.json(
                { error: "Erreur lors de la création de la commande" },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true, orderId: (order as { id: string }).id }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/store/order] Unexpected error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
