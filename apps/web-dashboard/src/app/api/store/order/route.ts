/**
 * POST /api/store/order
 * Crée une commande client (route publique — pas d'auth requise).
 * Utilisée depuis la vitrine /r/[slug] (web) et potentiellement le mobile.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { pushOrderStatusChange } from "@/lib/firebase/order-push";

const ALLOWED_DELIVERY_TYPES = ["delivery", "pickup", "dine_in"] as const;
const ALLOWED_PAYMENT_METHODS = ["cash", "mobile_money_mtn", "mobile_money_orange"] as const;
const PHONE_REGEX = /^(\+?237|0)?[679]\d{8}$/; // Cameroon phone format

type DeliveryType = (typeof ALLOWED_DELIVERY_TYPES)[number];
type PaymentMethod = (typeof ALLOWED_PAYMENT_METHODS)[number];

function isValidPhoneNumber(phone: string): boolean {
    return PHONE_REGEX.test(phone.replace(/\s+/g, ""));
}

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
    customerId?: string;
    scheduledFor?: string; // ISO 8601 — null/absent = commande immédiate
    notes?: string;
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
        if (!isValidPhoneNumber(body.customerPhone)) {
            return NextResponse.json({ error: "customerPhone doit être un numéro valide (ex: +237XXXXXXXXX ou 6XXXXXXXX)" }, { status: 400 });
        }
        if (!ALLOWED_DELIVERY_TYPES.includes(body.deliveryType)) {
            return NextResponse.json({ error: "deliveryType invalide" }, { status: 400 });
        }
        if (!ALLOWED_PAYMENT_METHODS.includes(body.paymentMethod)) {
            return NextResponse.json({ error: "paymentMethod invalide" }, { status: 400 });
        }

        // ── Scheduled order validation ──────────────────────────────────────
        let scheduledFor: string | null = null;
        let isScheduled = false;
        if (body.scheduledFor) {
            const scheduledDate = new Date(body.scheduledFor);
            if (isNaN(scheduledDate.getTime())) {
                return NextResponse.json({ error: "scheduledFor invalide (format ISO 8601 attendu)" }, { status: 400 });
            }
            const now = Date.now();
            const minDate = new Date(now + 30 * 60 * 1000); // minimum 30 min dans le futur
            const maxDate = new Date(now + 30 * 24 * 60 * 60 * 1000); // maximum 30 jours dans le futur

            if (scheduledDate < minDate) {
                return NextResponse.json({ error: "La commande programmée doit être au minimum 30 minutes dans le futur" }, { status: 400 });
            }
            if (scheduledDate > maxDate) {
                return NextResponse.json({ error: "La commande programmée doit être au maximum 30 jours dans le futur" }, { status: 400 });
            }
            scheduledFor = scheduledDate.toISOString();
            isScheduled = true;
        }

        const supabase = await createAdminClient();

        // ── Insert order ───────────────────────────────────────────────────
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                restaurant_id: body.restaurantId,
                customer_id: body.customerId ?? null,
                customer_name: body.customerName.trim(),
                customer_phone: body.customerPhone.trim(),
                items: body.items,
                subtotal: body.subtotal,
                delivery_fee: body.deliveryFee,
                service_fee: 0,
                corkage_fee: 0,
                tip_amount: 0,
                total: body.total,
                status: isScheduled ? "scheduled" : "pending",
                delivery_type: body.deliveryType,
                delivery_address: body.deliveryAddress ?? null,
                payment_method: body.paymentMethod,
                payment_status: "pending",
                notes: body.notes ?? null,
                table_number: body.tableNumber ?? null,
                table_id: null,
                covers: null,
                external_drinks_count: 0,
                // N'inclure scheduled_for que si la valeur est définie
                ...(scheduledFor ? { scheduled_for: scheduledFor } : {}),
            })
            .select("id, delivery_code")
            .single();

        if (orderError) {
            console.error("[POST /api/store/order] Supabase error:", orderError);
            return NextResponse.json(
                {
                    error: "Erreur lors de la création de la commande",
                },
                { status: 500 },
            );
        }

        const createdOrder = order as { id: string; delivery_code: string | null };

        // ── Push notification to restaurant (fire-and-forget) ──────────
        // Fetch restaurant name for push message
        const { data: restInfo } = await supabase
            .from("restaurants")
            .select("name")
            .eq("id", body.restaurantId)
            .single();

        const restaurantName = restInfo && typeof restInfo === "object" && "name" in restInfo
            ? String(restInfo.name)
            : "Restaurant";

        pushOrderStatusChange(supabase, isScheduled ? "scheduled" : "pending", {
            orderId: createdOrder.id,
            orderRef: "",
            restaurantId: body.restaurantId,
            restaurantName,
            customerId: body.customerId ?? null,
            total: body.total,
            deliveryType: body.deliveryType,
        }).catch(() => {});

        return NextResponse.json(
            {
                success: true,
                orderId: createdOrder.id,
                isScheduled: !!scheduledFor,
                scheduledFor,
                deliveryCode: body.deliveryType === "delivery" ? (createdOrder.delivery_code ?? null) : null,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("[POST /api/store/order] Unexpected error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
