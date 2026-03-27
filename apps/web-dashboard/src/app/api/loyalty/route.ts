/**
 * GET  /api/loyalty  — fetch loyalty program + rewards for current restaurant
 * POST /api/loyalty  — create or update loyalty program
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET() {
    try {
        const { ctx, error } = await withAuth();
        if (error) return error;

        const { supabase, restaurantId } = ctx;

        // Fetch program
        const { data: program, error: progErr } = await supabase
            .from("loyalty_programs" as any)
            .select("*")
            .eq("restaurant_id", restaurantId)
            .maybeSingle();

        if (progErr) throw progErr;

        // Fetch rewards if program exists
        let rewards: any[] = [];
        if (program) {
            const { data: rewardsData, error: rwErr } = await supabase
                .from("loyalty_rewards" as any)
                .select("*")
                .eq("program_id", (program as any).id)
                .eq("is_active", true)
                .order("points_required", { ascending: true });

            if (rwErr) throw rwErr;
            rewards = rewardsData ?? [];
        }

        return NextResponse.json({ program, rewards });
    } catch (err: any) {
        console.error("[GET /api/loyalty]", err);
        return apiError(err.message || "Erreur serveur", 500);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { ctx, error } = await withAuth();
        if (error) return error;

        const { supabase, restaurantId } = ctx;
        const body = await request.json();
        const { name, points_per_fcfa, is_active } = body;

        if (points_per_fcfa !== undefined && (typeof points_per_fcfa !== "number" || points_per_fcfa < 1)) {
            return apiError("points_per_fcfa doit etre un entier >= 1", 400);
        }

        // Check if program already exists
        const { data: existing } = await supabase
            .from("loyalty_programs" as any)
            .select("id")
            .eq("restaurant_id", restaurantId)
            .maybeSingle();

        let program;

        if (existing) {
            // Update existing program
            const updates: Record<string, any> = {};
            if (name !== undefined) updates.name = name;
            if (points_per_fcfa !== undefined) updates.points_per_fcfa = points_per_fcfa;
            if (is_active !== undefined) updates.is_active = is_active;

            const { data, error: upErr } = await supabase
                .from("loyalty_programs" as any)
                .update(updates)
                .eq("id", (existing as any).id)
                .select()
                .single();

            if (upErr) throw upErr;
            program = data;
        } else {
            // Create new program
            const { data, error: insErr } = await supabase
                .from("loyalty_programs" as any)
                .insert({
                    restaurant_id: restaurantId,
                    name: name || "Programme de fidelite",
                    points_per_fcfa: points_per_fcfa ?? 1,
                    is_active: is_active ?? true,
                })
                .select()
                .single();

            if (insErr) throw insErr;
            program = data;
        }

        return NextResponse.json({ program }, { status: existing ? 200 : 201 });
    } catch (err: any) {
        console.error("[POST /api/loyalty]", err);
        return apiError(err.message || "Erreur serveur", 500);
    }
}
