import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * POST /api/marketplace/confirm-payment
 * Confirm a marketplace purchase payment and activate the pack
 * Called after payment is confirmed via webhook or manual verification
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { restaurantId } = auth.ctx;

        const body = await request.json();
        const { paymentReferenceId, purchaseId } = body;

        if (!paymentReferenceId && !purchaseId) {
            return apiError("paymentReferenceId ou purchaseId requis", 400);
        }

        const admin = await createAdminClient();

        // Find the purchase record
        let purchase;
        if (purchaseId) {
            const { data, error } = await admin
                .from("marketplace_purchases")
                .select("id, restaurant_id, service_id, status, payment_reference")
                .eq("id", purchaseId)
                .eq("restaurant_id", restaurantId)
                .single();

            if (error || !data) {
                return apiError("Achat non trouvé", 404);
            }
            purchase = data;
        } else {
            const { data, error } = await admin
                .from("marketplace_purchases")
                .select("id, restaurant_id, service_id, status, payment_reference")
                .eq("payment_reference", paymentReferenceId)
                .eq("restaurant_id", restaurantId)
                .single();

            if (error || !data) {
                return apiError("Achat non trouvé", 404);
            }
            purchase = data;
        }

        // Check if already activated
        if (purchase.status === "active") {
            return NextResponse.json({
                success: true,
                message: "Pack déjà activé",
                purchase: {
                    id: purchase.id,
                    status: "active",
                },
            });
        }

        // Check if payment failed
        if (purchase.status === "failed") {
            return apiError("Le paiement a échoué", 400);
        }

        // Find the corresponding payment transaction
        const { data: transaction, error: txError } = await admin
            .from("payment_transactions")
            .select("id, status, provider_status")
            .eq("reference_id", purchase.payment_reference)
            .single();

        if (txError || !transaction) {
            return apiError("Transaction de paiement non trouvée", 404);
        }

        // Only activate if payment is successful
        if (transaction.status !== "success") {
            return apiError(
                `Le paiement n'est pas confirmé. Statut: ${transaction.status}`,
                400
            );
        }

        // Activate the purchase
        const { data: updatedPurchase, error: updateError } = await admin
            .from("marketplace_purchases")
            .update({
                status: "active",
                notes: `Activé via paiement ${purchase.payment_reference}`,
                updated_at: new Date().toISOString(),
            })
            .eq("id", purchase.id)
            .select()
            .single();

        if (updateError || !updatedPurchase) {
            console.error("Purchase update error:", updateError);
            return apiError("Impossible d'activer le pack", 500);
        }

        return NextResponse.json({
            success: true,
            message: "Pack activé avec succès!",
            purchase: {
                id: (updatedPurchase as any).id,
                status: (updatedPurchase as any).status,
                serviceId: (updatedPurchase as any).service_id,
                expiresAt: (updatedPurchase as any).expires_at,
            },
        });
    } catch (error) {
        console.error("POST /api/marketplace/confirm-payment error:", error);
        return apiError("Erreur lors de la confirmation du paiement");
    }
}
