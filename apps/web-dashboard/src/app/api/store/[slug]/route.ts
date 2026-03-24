/**
 * GET /api/store/[slug]
 * Route publique — retourne les infos du restaurant + menu + avis.
 * Pas d'auth requise.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { slug } = await params;
        if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

        const supabase = await createAdminClient();

        // 1. Résoudre le restaurant depuis le slug
        const { data: results, error: restError } = await supabase
            .from("restaurants")
            .select("*")
            .eq("slug", slug)
            .eq("is_published", true)
            .limit(1);

        if (restError || !results || results.length === 0) {
            return NextResponse.json({ error: "Restaurant non trouvé" }, { status: 404 });
        }

        const rest = results[0] as any;

        // 2. Requêtes parallèles : catégories, produits, avis, showcase, membres
        const [categoriesRes, productsRes, reviewsRes, showcaseRes, membersRes, badgesRes] = await Promise.all([
            supabase
                .from("categories")
                .select("id, name, description, sort_order")
                .eq("restaurant_id", rest.id)
                .order("sort_order"),
            supabase
                .from("products")
                .select("id, name, description, price, compare_at_price, image_url, is_available, category_id, sort_order, product_images(url, display_order)")
                .eq("restaurant_id", rest.id)
                .eq("is_available", true)
                .order("sort_order"),
            supabase
                .from("reviews")
                .select("id, rating, comment, response, created_at, customer_id")
                .eq("restaurant_id", rest.id)
                .eq("is_visible", true)
                .order("created_at", { ascending: false })
                .limit(20),
            supabase
                .from("showcase_sections")
                .select("id, section_type, title, subtitle, content, display_order, is_visible, settings")
                .eq("restaurant_id", rest.id)
                .eq("is_visible", true)
                .order("display_order"),
            supabase
                .from("restaurant_members")
                .select("id, user_id, role, status")
                .eq("restaurant_id", rest.id)
                .eq("status", "active"),
            supabase
                .from("restaurant_badges")
                .select("badge_type, badge_name, earned_at, metadata")
                .eq("restaurant_id", rest.id)
                .order("earned_at"),
        ]);

        // 3. Noms clients pour les avis
        const reviewData = reviewsRes.data ?? [];
        const customerIds = [...new Set(reviewData.map((r: any) => r.customer_id).filter(Boolean))];
        const customerMap: Record<string, string> = {};
        if (customerIds.length > 0) {
            const { data: users } = await supabase
                .from("users")
                .select("id, full_name")
                .in("id", customerIds);
            for (const u of users ?? []) {
                customerMap[(u as any).id] = (u as any).full_name ?? "Client";
            }
        }

        // 4. Profils membres
        const memberRows = membersRes.data ?? [];
        const memberUserIds = [...new Set(memberRows.map((m: any) => m.user_id).filter(Boolean))] as string[];
        const memberUsersMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
        if (memberUserIds.length > 0) {
            const { data: memberUsers } = await supabase
                .from("users")
                .select("id, full_name, avatar_url")
                .in("id", memberUserIds);
            for (const u of memberUsers ?? []) {
                memberUsersMap[(u as any).id] = {
                    full_name: (u as any).full_name ?? null,
                    avatar_url: (u as any).avatar_url ?? null,
                };
            }
        }

        return NextResponse.json({
            restaurant: {
                id: rest.id,
                name: rest.name,
                slug: rest.slug,
                description: rest.description,
                logoUrl: rest.logo_url,
                coverUrl: rest.cover_url ?? rest.banner_url,
                address: rest.address,
                city: rest.city,
                phone: rest.phone,
                email: rest.email,
                cuisineType: rest.cuisine_type,
                primaryColor: rest.primary_color,
                openingHours: rest.opening_hours,
                rating: rest.rating,
                reviewCount: rest.review_count,
                orderCount: rest.order_count,
                isVerified: rest.is_verified,
                isPremium: rest.is_premium,
                hasDineIn: rest.has_dine_in,
                hasReservations: rest.has_reservations,
                totalTables: rest.total_tables,
                deliveryFee: rest.delivery_fee,
                minOrderAmount: rest.min_order_amount,
                dineInServiceFee: rest.dine_in_service_fee ?? 0,
                corkageFeeAmount: rest.corkage_fee_amount ?? 0,
                reservationSlotDuration: rest.reservation_slot_duration ?? 90,
                reservationOpenTime: rest.reservation_open_time ?? "10:00",
                reservationCloseTime: rest.reservation_close_time ?? "22:00",
                reservationSlotInterval: rest.reservation_slot_interval ?? 30,
                orderCancelPolicy: rest.order_cancel_policy ?? "flexible",
                orderCancelNoticeMinutes: rest.order_cancel_notice_minutes ?? 30,
                orderCancellationFeeAmount: rest.order_cancellation_fee_amount ?? 0,
                reservationCancelPolicy: rest.reservation_cancel_policy ?? "flexible",
                reservationCancelNoticeMinutes: rest.reservation_cancel_notice_minutes ?? 120,
                reservationCancellationFeeAmount: rest.reservation_cancellation_fee_amount ?? 0,
                loyaltyEnabled: rest.loyalty_enabled ?? false,
                loyaltyPointsPerOrder: rest.loyalty_points_per_order ?? 10,
                loyaltyPointValue: rest.loyalty_point_value ?? 1,
                loyaltyMinRedeemPoints: rest.loyalty_min_redeem_points ?? 100,
                loyaltyRewardTiers: rest.loyalty_reward_tiers ?? [],
            },
            categories: categoriesRes.data ?? [],
            products: (productsRes.data ?? []).map((p: any) => {
                const extraImages: string[] = (p.product_images ?? [])
                    .sort((a: any, b: any) => a.display_order - b.display_order)
                    .map((img: any) => img.url);
                const images = p.image_url ? [p.image_url, ...extraImages] : extraImages;
                const { product_images: _, ...product } = p;
                return { ...product, images };
            }),
            reviews: reviewData.map((r: any) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                response: r.response,
                created_at: r.created_at,
                customerName: customerMap[r.customer_id] ?? "Client",
            })),
            showcaseSections: showcaseRes.data ?? [],
            teamMembers: memberRows.map((member: any) => {
                const profile = memberUsersMap[member.user_id];
                return {
                    id: member.id,
                    userId: member.user_id,
                    role: member.role,
                    status: member.status,
                    name: profile?.full_name ?? "Membre",
                    imageUrl: profile?.avatar_url ?? null,
                };
            }),
            badges: (badgesRes.data ?? []).map((b: any) => ({
                type: b.badge_type,
                name: b.badge_name,
                earnedAt: b.earned_at,
                icon: b.metadata?.icon ?? "medal",
            })),
        });
    } catch (error) {
        console.error("[GET /api/store/[slug]] error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
