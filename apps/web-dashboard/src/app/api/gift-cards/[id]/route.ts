import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * GET /api/gift-cards/[id]
 * Returns the gift card details + movement history.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    const { id } = params;

    try {
        // Fetch the card (ownership check via restaurant_id)
        const { data: card, error: cardErr } = await ctx.supabase
            .from("gift_cards")
            .select("*")
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId)
            .single();

        if (cardErr || !card) {
            return apiError("Carte cadeau introuvable", 404);
        }

        // Fetch movement history
        const { data: movements } = await ctx.supabase
            .from("gift_card_movements")
            .select("*")
            .eq("gift_card_id", id)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            gift_card: card,
            movements: movements ?? [],
        });
    } catch (err) {
        console.error("GET /api/gift-cards/[id] exception:", err);
        return apiError("Erreur interne");
    }
}

/**
 * DELETE /api/gift-cards/[id]
 * Deactivates (soft-delete) a gift card.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    const { id } = params;

    try {
        const { error: updateErr } = await ctx.supabase
            .from("gift_cards")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId);

        if (updateErr) {
            console.error("DELETE /api/gift-cards/[id] error:", updateErr);
            return apiError("Erreur lors de la désactivation");
        }

        // Record an expiration movement
        const { data: card } = await ctx.supabase
            .from("gift_cards")
            .select("current_balance")
            .eq("id", id)
            .single();

        if (card) {
            await ctx.supabase.from("gift_card_movements").insert({
                gift_card_id: id,
                amount: 0,
                balance_after: card.current_balance,
                type: "expire",
                note: "Désactivation manuelle",
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/gift-cards/[id] exception:", err);
        return apiError("Erreur interne");
    }
}

/**
 * PATCH /api/gift-cards/[id]
 * Update note, issued_to, or expires_at on a gift card.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    const { id } = params;

    try {
        const body = await request.json();
        const allowed = ["note", "issued_to", "expires_at", "is_active"];
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const field of allowed) {
            if (body[field] !== undefined) updateData[field] = body[field];
        }

        const { data, error: updateErr } = await ctx.supabase
            .from("gift_cards")
            .update(updateData)
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId)
            .select()
            .single();

        if (updateErr) {
            console.error("PATCH /api/gift-cards/[id] error:", updateErr);
            return apiError("Erreur lors de la mise à jour");
        }

        return NextResponse.json({ gift_card: data });
    } catch (err) {
        console.error("PATCH /api/gift-cards/[id] exception:", err);
        return apiError("Erreur interne");
    }
}
