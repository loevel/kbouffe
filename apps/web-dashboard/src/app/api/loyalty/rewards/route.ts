/**
 * GET    /api/loyalty/rewards  — list rewards for restaurant's program
 * POST   /api/loyalty/rewards  — create a new reward
 * DELETE /api/loyalty/rewards  — deactivate a reward (soft-delete)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/** Resolve the loyalty program id for the current restaurant */
async function getProgramId(supabase: any, restaurantId: string) {
    const { data, error } = await supabase
        .from("loyalty_programs" as any)
        .select("id")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

    if (error) throw error;
    return data?.id ?? null;
}

export async function GET() {
    try {
        const { ctx, error } = await withAuth();
        if (error) return error;

        const programId = await getProgramId(ctx.supabase, ctx.restaurantId);
        if (!programId) {
            return NextResponse.json({ rewards: [] });
        }

        const { data, error: qErr } = await ctx.supabase
            .from("loyalty_rewards" as any)
            .select("*")
            .eq("program_id", programId)
            .eq("is_active", true)
            .order("points_required", { ascending: true });

        if (qErr) throw qErr;

        return NextResponse.json({ rewards: data ?? [] });
    } catch (err: any) {
        console.error("[GET /api/loyalty/rewards]", err);
        return apiError(err.message || "Erreur serveur", 500);
    }
}

const VALID_TYPES = ["discount_percent", "discount_fixed", "free_item"];

export async function POST(request: NextRequest) {
    try {
        const { ctx, error } = await withAuth();
        if (error) return error;

        const programId = await getProgramId(ctx.supabase, ctx.restaurantId);
        if (!programId) {
            return apiError("Aucun programme de fidelite. Creez-en un d'abord.", 400);
        }

        const body = await request.json();
        const { name, description, points_required, reward_type, reward_value } = body;

        if (!name?.trim()) return apiError("Le nom est requis", 400);
        if (!points_required || points_required < 1) return apiError("Points requis invalides", 400);
        if (!VALID_TYPES.includes(reward_type)) return apiError("Type de recompense invalide", 400);
        if (!reward_value || reward_value < 1) return apiError("Valeur de recompense invalide", 400);

        const { data, error: insErr } = await ctx.supabase
            .from("loyalty_rewards" as any)
            .insert({
                program_id: programId,
                name: name.trim(),
                description: description?.trim() || null,
                points_required,
                reward_type,
                reward_value,
            })
            .select()
            .single();

        if (insErr) throw insErr;

        return NextResponse.json({ reward: data }, { status: 201 });
    } catch (err: any) {
        console.error("[POST /api/loyalty/rewards]", err);
        return apiError(err.message || "Erreur serveur", 500);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { ctx, error } = await withAuth();
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const rewardId = searchParams.get("id");
        if (!rewardId) return apiError("id requis", 400);

        const programId = await getProgramId(ctx.supabase, ctx.restaurantId);
        if (!programId) return apiError("Programme non trouve", 404);

        // Soft-delete: set is_active = false
        const { error: upErr } = await ctx.supabase
            .from("loyalty_rewards" as any)
            .update({ is_active: false })
            .eq("id", rewardId)
            .eq("program_id", programId);

        if (upErr) throw upErr;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[DELETE /api/loyalty/rewards]", err);
        return apiError(err.message || "Erreur serveur", 500);
    }
}
