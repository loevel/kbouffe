import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/dashboard/showcase
 * Auth required — returns ALL showcase sections for the merchant's restaurant (including hidden ones).
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const admin = await createAdminClient();

        // Find merchant's restaurant
        const { data: restaurant } = await admin
            .from("restaurants")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant non trouvé" }, { status: 404 });
        }

        const { data, error } = await admin
            .from("showcase_sections")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .order("display_order");

        if (error) {
            console.error("[Dashboard Showcase GET] Error:", error);
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }

        return NextResponse.json({ sections: data ?? [], restaurantId: restaurant.id });
    } catch (error: any) {
        console.error("[Dashboard Showcase GET] Unexpected:", error);
        return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
    }
}
