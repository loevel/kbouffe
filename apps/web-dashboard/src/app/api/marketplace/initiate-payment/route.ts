import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { requestToPay, mapMtnStatusToPaymentStatus } from "@/lib/payments/mtn";

/**
 * POST /api/marketplace/initiate-payment
 * Initiate a marketplace pack purchase with MTN Mobile Money payment
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { restaurantId, userId } = auth.ctx;

        const body = await request.json();
        const { serviceId, amount, paymentMethod, phoneNumber, provider, giftCardCode } = body;

        // Validate inputs
        if (!serviceId) {
            return apiError("serviceId requis", 400);
        }
        if (!amount || amount <= 0) {
            return apiError("Montant invalide", 400);
        }
        if (!paymentMethod || !["mobile_money", "gift_card"].includes(paymentMethod)) {
            return apiError("Méthode de paiement invalide", 400);
        }

        // Validate mobile money inputs
        if (paymentMethod === "mobile_money") {
            if (!phoneNumber || phoneNumber.trim().length < 9) {
                return apiError("Numéro de téléphone invalide", 400);
            }
            if (!provider || !["mtn_momo", "orange_money"].includes(provider)) {
                return apiError("Fournisseur invalide", 400);
            }
        }

        // Validate gift card inputs
        if (paymentMethod === "gift_card") {
            if (!giftCardCode || giftCardCode.trim().length === 0) {
                return apiError("Code carte cadeaux requis", 400);
            }
        }

        const admin = await createAdminClient();

        // Verify service exists and is active
        const { data: service, error: serviceError } = await admin
            .from("marketplace_services")
            .select("id, name, price, duration_days")
            .eq("id", serviceId)
            .eq("is_active", true)
            .single();

        if (serviceError || !service) {
            return apiError("Pack non trouvé ou inactif", 404);
        }

        // Verify amount matches service price
        if (amount !== service.price) {
            return apiError("Montant ne correspond pas au prix du pack", 400);
        }

        // Handle gift card payment
        if (paymentMethod === "gift_card") {
            const { data: giftCard, error: gcError } = await admin
                .from("gift_cards")
                .select("id, code, current_balance, expires_at, is_active, issued_by_type, usable_context")
                .eq("restaurant_id", restaurantId)
                .eq("code", giftCardCode.trim().toUpperCase())
                .eq("is_active", true)
                .maybeSingle();

            if (gcError || !giftCard) {
                return apiError("Code carte cadeaux invalide ou inactif", 400);
            }

            // ❌ Reject restaurant-issued cards or cards restricted to menu_only
            if ((giftCard as any).issued_by_type === "restaurant") {
                return apiError("Les cartes cadeaux du restaurant ne peuvent pas être utilisées pour les services marketplace", 400);
            }

            if ((giftCard as any).usable_context === "menu_only") {
                return apiError("Cette carte cadeaux ne peut être utilisée que pour les menus des restaurants", 400);
            }

            if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
                return apiError("Cette carte cadeaux a expiré", 400);
            }

            if ((giftCard.current_balance ?? 0) < amount) {
                return apiError(`Solde insuffisant. Disponible: ${giftCard.current_balance} FCFA`, 400);
            }

            // Deduct from gift card immediately
            const newBalance = (giftCard.current_balance ?? 0) - amount;
            const { error: updateError } = await admin
                .from("gift_cards")
                .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
                .eq("id", giftCard.id);

            if (updateError) {
                console.error("Gift card update error:", updateError);
                return apiError("Erreur lors de la déduction de la carte cadeaux", 500);
            }

            // Record the movement
            await admin.from("gift_card_movements").insert({
                gift_card_id: giftCard.id,
                amount: -amount,
                balance_after: newBalance,
                type: "purchase",
                note: `Achat pack marketplace: ${service.name}`,
            });

            // Create marketplace purchase (directly active for gift card)
            const startsAt = new Date();
            const expiresAt = service.duration_days
                ? new Date(Date.now() + service.duration_days * 24 * 60 * 60 * 1000)
                : null;

            const { data: purchase, error: purchaseError } = await admin
                .from("marketplace_purchases")
                .insert({
                    restaurant_id: restaurantId,
                    service_id: serviceId,
                    admin_id: userId,
                    status: "active", // Gift card = immediate payment = active
                    starts_at: startsAt.toISOString(),
                    expires_at: expiresAt?.toISOString() || null,
                    amount_paid: service.price,
                    notes: `Payé via carte cadeaux: ${giftCardCode.trim().toUpperCase()}`,
                    payment_reference: giftCard.id,
                })
                .select("id")
                .single();

            if (purchaseError || !purchase) {
                console.error("Purchase creation error:", purchaseError);
                return apiError("Impossible de créer l'enregistrement d'achat", 500);
            }

            return NextResponse.json({
                success: true,
                payment: {
                    purchaseId: (purchase as any).id,
                    paymentMethod: "gift_card",
                    status: "active",
                    amount: service.price,
                    serviceName: service.name,
                    message: "Pack activé immédiatement via carte cadeaux",
                },
            });
        }

        // Handle mobile money payment
        const referenceId = crypto.randomUUID();
        const externalId = `pack-${serviceId}-${Date.now()}`;

        const { data: transaction, error: txError } = await admin
            .from("payment_transactions")
            .insert({
                restaurant_id: restaurantId,
                service_id: serviceId,
                provider,
                reference_id: referenceId,
                external_id: externalId,
                payer_msisdn: phoneNumber.trim(),
                amount,
                currency: "XAF",
                status: "pending",
                provider_status: "PENDING",
            })
            .select("id, reference_id, status")
            .single();

        if (txError || !transaction) {
            console.error("Transaction creation error:", txError);
            return apiError("Impossible de créer la transaction de paiement", 500);
        }

        // Create marketplace purchase record (pending status)
        const startsAt = new Date();
        const expiresAt = service.duration_days
            ? new Date(Date.now() + service.duration_days * 24 * 60 * 60 * 1000)
            : null;

        const { data: purchase, error: purchaseError } = await admin
            .from("marketplace_purchases")
            .insert({
                restaurant_id: restaurantId,
                service_id: serviceId,
                admin_id: userId,
                status: "pending", // Not active until payment confirmed
                starts_at: startsAt.toISOString(),
                expires_at: expiresAt?.toISOString() || null,
                amount_paid: service.price,
                notes: `Paiement en attente - Ref: ${referenceId}`,
                payment_reference: referenceId,
            })
            .select("id")
            .single();

        if (purchaseError || !purchase) {
            console.error("Purchase creation error:", purchaseError);
            return apiError("Impossible de créer l'enregistrement d'achat", 500);
        }

        // Initiate MTN payment
        try {
            await requestToPay({
                referenceId,
                amount: service.price,
                currency: "XAF",
                externalId,
                payerMsisdn: phoneNumber.trim(),
                payerMessage: `Paiement ${service.name}`,
                payeeNote: `Pack: ${service.name}`,
            });
        } catch (providerError) {
            const message =
                providerError instanceof Error
                    ? providerError.message
                    : "Erreur lors du paiement";

            // Update transaction as failed
            await admin
                .from("payment_transactions")
                .update({
                    status: "failed",
                    provider_status: "FAILED",
                    failed_reason: message,
                    provider_response: { error: message },
                    updated_at: new Date().toISOString(),
                })
                .eq("id", (transaction as any).id);

            // Update purchase as failed
            await admin
                .from("marketplace_purchases")
                .update({
                    status: "failed",
                    notes: `Erreur de paiement: ${message}`,
                })
                .eq("id", (purchase as any).id);

            return apiError(message, 502);
        }

        const mappedStatus = mapMtnStatusToPaymentStatus("PENDING");

        return NextResponse.json({
            success: true,
            payment: {
                transactionId: (transaction as any).id,
                purchaseId: (purchase as any).id,
                referenceId: (transaction as any).reference_id,
                status: mappedStatus,
                paymentMethod: "mobile_money",
                amount: service.price,
                serviceName: service.name,
            },
        });
    } catch (error) {
        console.error("POST /api/marketplace/initiate-payment error:", error);
        return apiError("Erreur lors de l'initiation du paiement");
    }
}
