import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/helpers";

/**
 * GET /api/dashboard/showcase
 * Auth required — returns ALL showcase sections for the merchant's restaurant (including hidden ones).
 */
export async function GET(_request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const admin = await createAdminClient();
        const requestedRestaurantId = _request.nextUrl.searchParams.get("restaurantId");

        let restaurantId = ctx.restaurantId;
        if (requestedRestaurantId) {
            const { data: owned } = await admin
                .from("restaurants")
                .select("id")
                .eq("id", requestedRestaurantId)
                .eq("owner_id", ctx.userId)
                .maybeSingle();

            if (!owned) {
                const { data: member } = await admin
                    // @ts-expect-error — Table might be missing from generated types
                    .from("restaurant_members")
                    .select("restaurant_id")
                    .eq("restaurant_id", requestedRestaurantId)
                    .eq("user_id", ctx.userId)
                    .eq("status", "active")
                    .limit(1)
                    .maybeSingle();

                if (!member) {
                    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
                }
            }

            restaurantId = requestedRestaurantId;
        }

        const [{ data, error }, { data: membersRaw, error: membersError }] = await Promise.all([
            admin
            .from("showcase_sections")
            .select("*")
            .eq("restaurant_id", restaurantId)
            .order("display_order"),
            admin
                // @ts-expect-error — Table might be missing from generated types
                .from("restaurant_members")
                .select("id, user_id, role, status")
                .eq("restaurant_id", restaurantId)
                .eq("status", "active"),
        ]);

        if (error) {
            console.error("[Dashboard Showcase GET] Error:", error);
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }

        if (membersError) {
            console.error("[Dashboard Showcase GET] Members error:", membersError);
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }

        const memberRows = membersRaw ?? [];
        const userIds = [...new Set(memberRows.map((member: any) => member.user_id).filter(Boolean))] as string[];
        let userMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
        if (userIds.length > 0) {
            const { data: users, error: usersError } = await admin
                .from("users")
                .select("id, full_name, avatar_url")
                .in("id", userIds);

            if (usersError) {
                console.error("[Dashboard Showcase GET] Users error:", usersError);
                return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
            }

            userMap = new Map((users ?? []).map((user: any) => [
                user.id,
                { full_name: user.full_name ?? null, avatar_url: user.avatar_url ?? null },
            ]));
        }

        const teamMembers = memberRows.map((member: any) => {
            const profile = userMap.get(member.user_id);
            return {
                id: member.id,
                userId: member.user_id,
                role: member.role,
                status: member.status,
                name: profile?.full_name ?? "Membre",
                imageUrl: profile?.avatar_url ?? null,
            };
        });

        return NextResponse.json({ sections: data ?? [], restaurantId, teamMembers });
    } catch (error: any) {
        console.error("[Dashboard Showcase GET] Unexpected:", error);
        return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
    }
}
