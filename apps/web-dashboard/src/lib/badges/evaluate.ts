import type { SupabaseClient } from "@supabase/supabase-js";
import { BADGE_DEFINITIONS, BADGE_ICON_MAP } from "./definitions";
import { sendPushToRestaurant } from "@/lib/firebase/send-push";

/**
 * Evaluate and award badges for a restaurant.
 * Called after order completion (delivered/completed) and after new reviews.
 * Fire-and-forget — never throws.
 */
export async function evaluateBadges(
    adminDb: SupabaseClient,
    restaurantId: string,
): Promise<void> {
    try {
        // 1. Get existing badges
        const { data: existingBadges } = await adminDb
            .from("restaurant_badges")
            .select("badge_type")
            .eq("restaurant_id", restaurantId);

        const earned = new Set(
            (existingBadges ?? []).map((b: { badge_type: string }) => b.badge_type),
        );

        const newBadges: { type: string; name: string }[] = [];

        // 2. Check order count badges
        const orderBadges = Object.entries(BADGE_DEFINITIONS).filter(
            ([, def]) => def.check === "order_count" && def.threshold,
        );

        // Only query if there are unearded order badges
        const unearned = orderBadges.filter(([key]) => !earned.has(key));
        if (unearned.length > 0) {
            const { count } = await adminDb
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("restaurant_id", restaurantId)
                .in("status", ["delivered", "completed"]);

            const totalOrders = count ?? 0;

            for (const [key, def] of unearned) {
                if (totalOrders >= (def.threshold ?? 0)) {
                    newBadges.push({ type: key, name: def.nameFr });
                }
            }
        }

        // 3. Check first 5-star review
        if (!earned.has("first_5star")) {
            const { data: fiveStarReview } = await adminDb
                .from("reviews")
                .select("id")
                .eq("restaurant_id", restaurantId)
                .eq("rating", 5)
                .limit(1)
                .maybeSingle();

            if (fiveStarReview) {
                newBadges.push({
                    type: "first_5star",
                    name: BADGE_DEFINITIONS.first_5star.nameFr,
                });
            }
        }

        // 4. Check perfect week (no cancellations in last 7 days with at least 1 order)
        if (!earned.has("week_no_cancel")) {
            const sevenDaysAgo = new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString();

            const { count: recentOrders } = await adminDb
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("restaurant_id", restaurantId)
                .gte("created_at", sevenDaysAgo);

            if ((recentOrders ?? 0) > 0) {
                const { count: cancelledCount } = await adminDb
                    .from("orders")
                    .select("id", { count: "exact", head: true })
                    .eq("restaurant_id", restaurantId)
                    .eq("status", "cancelled")
                    .gte("created_at", sevenDaysAgo);

                if ((cancelledCount ?? 0) === 0) {
                    newBadges.push({
                        type: "week_no_cancel",
                        name: BADGE_DEFINITIONS.week_no_cancel.nameFr,
                    });
                }
            }
        }

        // 5. Award new badges
        for (const badge of newBadges) {
            const def = BADGE_DEFINITIONS[badge.type];
            const emoji = BADGE_ICON_MAP[def.icon] ?? "🏅";

            // Insert badge (ignore conflict if already exists)
            await adminDb.from("restaurant_badges").upsert(
                {
                    restaurant_id: restaurantId,
                    badge_type: badge.type,
                    badge_name: badge.name,
                    metadata: { icon: def.icon },
                },
                { onConflict: "restaurant_id,badge_type", ignoreDuplicates: true },
            );

            // Insert notification
            await adminDb.from("restaurant_notifications").insert({
                restaurant_id: restaurantId,
                type: "badge_earned",
                title: `${emoji} Nouveau badge !`,
                body: `Felicitations ! Vous avez debloque le badge "${badge.name}".`,
                payload: { badge_type: badge.type, badge_name: badge.name, icon: def.icon },
            });

            // Push notification
            await sendPushToRestaurant(adminDb, restaurantId, {
                title: `${emoji} Nouveau badge !`,
                body: `Vous avez debloque "${badge.name}" !`,
                data: { type: "badge_earned", badge_type: badge.type },
                link: "/dashboard",
            });
        }
    } catch (err) {
        console.error("[evaluateBadges]", err);
    }
}
