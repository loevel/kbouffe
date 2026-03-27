/**
 * GET /api/loyalty/stats — loyalty statistics for the current restaurant
 */
import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET() {
    try {
        const { ctx, error } = await withAuth();
        if (error) return error;

        const { supabase, restaurantId } = ctx;

        // Total members
        const { count: totalMembers } = await supabase
            .from("customer_loyalty" as any)
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId);

        // Active members this month (had a transaction this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: activeData } = await supabase
            .from("loyalty_transactions" as any)
            .select("customer_loyalty_id")
            .gte("created_at", startOfMonth.toISOString())
            .in(
                "customer_loyalty_id",
                supabase
                    .from("customer_loyalty" as any)
                    .select("id")
                    .eq("restaurant_id", restaurantId)
            );

        const activeMembers = new Set((activeData ?? []).map((t: any) => t.customer_loyalty_id)).size;

        // Total points distributed
        const { data: pointsData } = await supabase
            .from("customer_loyalty" as any)
            .select("total_points_earned")
            .eq("restaurant_id", restaurantId);

        const totalPointsDistributed = (pointsData ?? []).reduce(
            (sum: number, row: any) => sum + (row.total_points_earned || 0),
            0
        );

        // Top rewards redeemed — count redemption transactions per reward
        const { data: redemptions } = await supabase
            .from("loyalty_transactions" as any)
            .select("reward_id")
            .eq("type", "redeem")
            .not("reward_id", "is", null)
            .in(
                "customer_loyalty_id",
                supabase
                    .from("customer_loyalty" as any)
                    .select("id")
                    .eq("restaurant_id", restaurantId)
            );

        // Aggregate redemption counts
        const rewardCounts: Record<string, number> = {};
        for (const r of redemptions ?? []) {
            if (r.reward_id) {
                rewardCounts[r.reward_id] = (rewardCounts[r.reward_id] || 0) + 1;
            }
        }

        // Fetch reward names for top 5
        const topRewardIds = Object.entries(rewardCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id]) => id);

        let topRewards: any[] = [];
        if (topRewardIds.length > 0) {
            const { data: rewardNames } = await supabase
                .from("loyalty_rewards" as any)
                .select("id, name")
                .in("id", topRewardIds);

            topRewards = topRewardIds.map((id) => {
                const reward = (rewardNames ?? []).find((r: any) => r.id === id);
                return {
                    id,
                    name: reward?.name ?? "Recompense supprimee",
                    redemptions: rewardCounts[id],
                };
            });
        }

        // Top 10 members by points
        const { data: topMembers } = await supabase
            .from("customer_loyalty" as any)
            .select("id, customer_id, points_balance, total_points_earned, tier, created_at")
            .eq("restaurant_id", restaurantId)
            .order("total_points_earned", { ascending: false })
            .limit(10);

        // Enrich with user names
        const customerIds = (topMembers ?? []).map((m: any) => m.customer_id);
        let usersMap: Record<string, any> = {};
        if (customerIds.length > 0) {
            const { data: users } = await supabase
                .from("users")
                .select("id, full_name, email, phone")
                .in("id", customerIds);

            for (const u of users ?? []) {
                usersMap[u.id] = u;
            }
        }

        const membersWithNames = (topMembers ?? []).map((m: any) => ({
            ...m,
            customer: usersMap[m.customer_id] ?? null,
        }));

        return NextResponse.json({
            totalMembers: totalMembers ?? 0,
            activeMembers,
            totalPointsDistributed,
            topRewards,
            topMembers: membersWithNames,
        });
    } catch (err: any) {
        console.error("[GET /api/loyalty/stats]", err);
        return apiError(err.message || "Erreur serveur", 500);
    }
}
