/**
 * POST /api/store/order
 * Crée une commande client (route publique — pas d'auth requise).
 * Utilisée depuis la vitrine /r/[slug] (web) et potentiellement le mobile.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { pushOrderStatusChange } from "@/lib/firebase/order-push";
import { getDeliveryFee } from "@/lib/store/pricing";

const ALLOWED_DELIVERY_TYPES = ["delivery", "pickup", "dine_in"] as const;
const ALLOWED_PAYMENT_METHODS = ["cash", "mobile_money_mtn", "mobile_money_orange", "gift_card"] as const;
const PHONE_REGEX = /^(\+?237|0)?[679]\d{8}$/; // Cameroon phone format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    options?: Array<{ name: string; value: string; price_adjustment?: number }>;
    notes?: string;
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
    giftCardCode?: string;
    subtotal: number;
    deliveryFee: number;
    /** Frais de service Kbouffe (FCFA) — était perdu et enregistré à 0. */
    serviceFee?: number;
    /** Remise code promo déjà validée côté client (revalidée ici). */
    discount?: number;
    couponCode?: string;
    total: number;
    customerId?: string;
    scheduledFor?: string; // ISO 8601 — null/absent = commande immédiate
    notes?: string;
}

/**
 * Recalcule la remise réellement accordée par un code promo.
 * Le client envoie le montant affiché au panier ; on ne lui fait jamais
 * confiance : la remise appliquée est bornée par ce que le coupon autorise.
 */
async function resolveCouponDiscount(
    supabase: Awaited<ReturnType<typeof createAdminClient>>,
    restaurantId: string,
    code: string,
    subtotal: number,
    requestedDiscount: number,
): Promise<number> {
    // restaurantId part dans un filtre PostgREST textuel : n'accepter qu'un UUID.
    if (!UUID_REGEX.test(restaurantId)) return 0;

    const { data: coupons, error } = await supabase
        .from("coupons")
        .select("id, kind, value, max_discount, min_order, min_order_amount, starts_at, expires_at, max_uses, current_uses, restaurant_id")
        .eq("code", code)
        .eq("is_active", true)
        .or(`restaurant_id.eq.${restaurantId},restaurant_id.is.null`)
        .limit(2);

    if (error || !coupons?.length) return 0;
    // Un coupon propre au restaurant prime sur un coupon global de même code.
    const coupon = coupons.find((c) => c.restaurant_id === restaurantId) ?? coupons[0];

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) return 0;
    if (coupon.expires_at && new Date(coupon.expires_at) < now) return 0;
    if (coupon.max_uses != null && (coupon.current_uses ?? 0) >= coupon.max_uses) return 0;

    const minOrder = coupon.min_order_amount ?? coupon.min_order ?? 0;
    if (subtotal < minOrder) return 0;

    const kind = String(coupon.kind ?? "").toLowerCase();
    const value = Number(coupon.value ?? 0);
    let maxDiscount = kind.includes("percent")
        ? Math.round((subtotal * value) / 100)
        : Math.round(value);
    if (coupon.max_discount != null) maxDiscount = Math.min(maxDiscount, coupon.max_discount);

    return Math.max(0, Math.min(requestedDiscount, maxDiscount, subtotal));
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
        if (body.paymentMethod === "gift_card" && !body.giftCardCode?.trim()) {
            return NextResponse.json({ error: "Code carte cadeau requis" }, { status: 400 });
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

        // ── Totaux recalculés côté serveur ──────────────────────────────────
        // Le total était repris tel quel du client, et le frais de service
        // facturé au client était enregistré à 0 dans la commande.
        const subtotal    = Math.max(0, Math.round(Number(body.subtotal) || 0));
        const serviceFee  = Math.max(0, Math.round(Number(body.serviceFee) || 0));

        // Les frais de livraison viennent du restaurant, jamais du client. Ils
        // étaient repris tels quels du corps de la requête : n'importe quel
        // appelant pouvait donc se facturer une livraison à 0. Le tarif est
        // désormais lu en base, et le forfait ne sert que si le restaurant n'en
        // a pas défini — auquel cas retirer et manger sur place restent
        // gratuits, comme avant.
        const { data: restoTarif } = await supabase
            .from("restaurants")
            .select("delivery_fee")
            .eq("id", body.restaurantId)
            .maybeSingle();

        const deliveryFee = getDeliveryFee(
            body.deliveryType,
            (restoTarif as { delivery_fee: number | null } | null)?.delivery_fee,
        );

        if (Number.isFinite(body.deliveryFee) && Math.abs(Number(body.deliveryFee) - deliveryFee) > 1) {
            console.warn(
                `[POST /api/store/order] Frais client (${body.deliveryFee}) != tarif du restaurant (${deliveryFee}) — le serveur fait foi.`,
            );
        }

        const requestedDiscount = Math.max(0, Math.round(Number(body.discount) || 0));
        let discount = 0;
        if (requestedDiscount > 0 && body.couponCode?.trim()) {
            discount = await resolveCouponDiscount(
                supabase,
                body.restaurantId,
                body.couponCode.trim().toUpperCase(),
                subtotal,
                requestedDiscount,
            );
        }

        const orderTotal = Math.max(0, subtotal + deliveryFee + serviceFee - discount);
        if (Number.isFinite(body.total) && Math.abs(Number(body.total) - orderTotal) > 1) {
            console.warn(
                `[POST /api/store/order] Total client (${body.total}) != total recalculé (${orderTotal}) — le total serveur fait foi.`,
            );
        }

        let giftCardContext: { id: string; current_balance: number } | null = null;
        let giftCardAppliedAmount = 0;
        let remainingToPay = orderTotal;
        let finalPaymentMethod: PaymentMethod | "mixed" = body.paymentMethod;
        let finalPaymentStatus: "pending" | "paid" = "pending";

        if (body.paymentMethod === "gift_card") {
            const giftCardCode = body.giftCardCode!.trim().toUpperCase();
            const { data: giftCard, error: giftCardError } = await supabase
                .from("gift_cards")
                .select("id, current_balance, expires_at, is_active")
                .eq("restaurant_id", body.restaurantId)
                .eq("code", giftCardCode)
                .eq("is_active", true)
                .maybeSingle();

            if (giftCardError || !giftCard) {
                return NextResponse.json({ error: "Carte cadeau invalide ou introuvable" }, { status: 400 });
            }
            if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
                return NextResponse.json({ error: "Cette carte cadeau a expiré" }, { status: 400 });
            }
            if ((giftCard.current_balance ?? 0) <= 0) {
                return NextResponse.json({ error: "Le solde de cette carte cadeau est épuisé" }, { status: 400 });
            }

            giftCardContext = {
                id: giftCard.id,
                current_balance: giftCard.current_balance ?? 0,
            };
            giftCardAppliedAmount = Math.min(giftCardContext.current_balance, orderTotal);
            remainingToPay = Math.max(0, orderTotal - giftCardAppliedAmount);
            finalPaymentMethod = remainingToPay > 0 ? "mixed" : "gift_card";
            finalPaymentStatus = remainingToPay > 0 ? "pending" : "paid";
        }
        const finalOrderTotal = Math.max(0, orderTotal - giftCardAppliedAmount);

        // ── Insert order ───────────────────────────────────────────────────
        const mergedNotes = [body.notes?.trim() || null];
        if (discount > 0) {
            // orders n'a pas de colonne remise : on la trace dans les notes pour
            // que le restaurant comprenne l'écart entre sous-total et total.
            mergedNotes.push(`Code promo ${body.couponCode?.trim().toUpperCase()}: -${discount} FCFA.`);
        }
        if (body.paymentMethod === "gift_card" && remainingToPay > 0) {
            mergedNotes.push(`Carte cadeau appliquée: ${giftCardAppliedAmount} FCFA. Reste à payer: ${remainingToPay} FCFA.`);
        }
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                restaurant_id: body.restaurantId,
                customer_id: body.customerId ?? null,
                customer_name: body.customerName.trim(),
                customer_phone: body.customerPhone.trim(),
                // items est une colonne jsonb : le type OrderItem (options
                // imbriquées) doit être élargi explicitement.
                items: body.items as unknown as Json,
                subtotal,
                delivery_fee: deliveryFee,
                service_fee: serviceFee,
                corkage_fee: 0,
                tip_amount: 0,
                total: finalOrderTotal,
                status: isScheduled ? "scheduled" : "pending",
                delivery_type: body.deliveryType,
                delivery_address: body.deliveryAddress ?? null,
                payment_method: finalPaymentMethod,
                payment_status: finalPaymentStatus,
                gift_card_id: giftCardContext?.id ?? null,
                gift_card_amount: giftCardAppliedAmount > 0 ? giftCardAppliedAmount : 0,
                notes: mergedNotes.filter(Boolean).join(" | ") || null,
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

        if (giftCardContext && giftCardAppliedAmount > 0) {
            const newBalance = giftCardContext.current_balance - giftCardAppliedAmount;
            const { data: updatedGiftCard, error: redeemError } = await supabase
                .from("gift_cards")
                .update({
                    current_balance: newBalance,
                    is_active: newBalance > 0,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", giftCardContext.id)
                .eq("restaurant_id", body.restaurantId)
                .eq("current_balance", giftCardContext.current_balance)
                .select("id")
                .maybeSingle();

            if (redeemError || !updatedGiftCard) {
                await supabase.from("orders").delete().eq("id", createdOrder.id);
                return NextResponse.json(
                    {
                        error: "Impossible d'appliquer la carte cadeau. Le solde a pu changer, veuillez réessayer.",
                    },
                    { status: 409 },
                );
            }

            const { error: movementError } = await supabase.from("gift_card_movements").insert({
                gift_card_id: giftCardContext.id,
                order_id: createdOrder.id,
                amount: -giftCardAppliedAmount,
                balance_after: newBalance,
                type: "redeem",
                note:
                    remainingToPay > 0
                        ? `Paiement partiel de commande (${remainingToPay} FCFA restants)`
                        : "Paiement total de commande",
            });
            if (movementError) {
                console.error("[POST /api/store/order] Failed to insert gift card movement:", movementError);
            }
        }

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
            total: finalOrderTotal,
            deliveryType: body.deliveryType,
        }).catch(() => {});

        return NextResponse.json(
            {
                success: true,
                orderId: createdOrder.id,
                total: finalOrderTotal,
                discount,
                serviceFee,
                isScheduled: !!scheduledFor,
                scheduledFor,
                giftCardAppliedAmount,
                remainingToPay,
                paymentMethod: finalPaymentMethod,
                deliveryCode: body.deliveryType === "delivery" ? (createdOrder.delivery_code ?? null) : null,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("[POST /api/store/order] Unexpected error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
