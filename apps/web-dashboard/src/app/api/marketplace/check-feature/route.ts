/**
 * GET /api/marketplace/check-feature?feature=pixel_tracking
 * Checks if the authenticated user's restaurant has an active premium storefront pack.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasPremiumStorefront } from "@/lib/premium-features";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ active: false }, { status: 401 });
        }

        const { data: dbUser } = await supabase
            .from("users")
            .select("restaurant_id")
            .eq("id", user.id)
            .single();

        if (!dbUser?.restaurant_id) {
            return NextResponse.json({ active: false });
        }

        const active = await hasPremiumStorefront(supabase, dbUser.restaurant_id);

        return NextResponse.json({ active });
    } catch (error: any) {
        console.error("[GET /api/marketplace/check-feature] error:", error);
        return NextResponse.json({ active: false }, { status: 500 });
    }
}
