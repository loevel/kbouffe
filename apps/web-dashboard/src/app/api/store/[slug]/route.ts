/**
 * GET /api/store/[slug]
 * Route publique — retourne les infos du restaurant + menu + avis.
 * Pas d'auth requise.
 * Cache CDN : s-maxage=60, stale-while-revalidate=300
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hasPremiumStorefront } from "@/lib/premium-features";

type Params = { params: Promise<{ slug: string }> };

// Colonnes explicites — évite le select("*") et ses ~40 colonnes inutilisées
const RESTAURANT_COLUMNS = [
    "id", "name", "slug", "description", "logo_url", "cover_url", "banner_url",
    "address", "city", "phone", "email", "cuisine_type", "primary_color",
    "opening_hours", "rating", "review_count", "order_count",
    "is_verified", "is_premium", "has_dine_in", "has_reservations", "total_tables",
    "delivery_fee", "min_order_amount", "dine_in_service_fee", "corkage_fee_amount",
    "reservation_slot_duration", "reservation_open_time", "reservation_close_time", "reservation_slot_interval",
    "order_cancel_policy", "order_cancel_notice_minutes", "order_cancellation_fee_amount",
    "reservation_cancel_policy", "reservation_cancel_notice_minutes", "reservation_cancellation_fee_amount",
    "loyalty_enabled", "loyalty_points_per_order", "loyalty_point_value",
    "loyalty_min_redeem_points", "loyalty_reward_tiers",
    "meta_pixel_id", "google_analytics_id", "theme_layout",
    "delivery_base_fee", "delivery_per_km_fee", "max_delivery_radius_km",
].join(", ");

export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { slug } = await params;
        if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

        const supabase = await createAdminClient();

        // 1. Résoudre le restaurant (colonnes explicites, pas de select *)
        const { data: results, error: restError } = await supabase
            .from("restaurants")
            .select(RESTAURANT_COLUMNS)
            .eq("slug", slug)
            .eq("is_published", true)
            .limit(1);

        if (restError || !results || results.length === 0) {
            return NextResponse.json({ error: "Restaurant non trouvé" }, { status: 404 });
        }

        const rest = results[0] as any;

        // 2. Toutes les requêtes en parallèle — hasPremiumStorefront inclus
        const [
            hasPremium,
            categoriesRes, productsRes, reviewsRes,
            showcaseRes, membersRes, badgesRes, announcementsRes,
        ] = await Promise.all([
            hasPremiumStorefront(supabase, rest.id),
            supabase
                .from("categories")
                .select("id, name, description, sort_order")
                .eq("restaurant_id", rest.id)
                .order("sort_order"),
            supabase
                .from("products")
                .select("id, name, description, price, compare_at_price, image_url, is_available, category_id, sort_order, is_featured, is_limited_edition, stock_quantity, available_until, product_images(url, display_order)")
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
            supabase
                .from("store_announcements")
                .select("id, message, type, color, starts_at, ends_at")
                .eq("restaurant_id", rest.id)
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(5),
        ]);

        // 3. Résolution des noms — 2 requêtes users en parallèle (étaient séquentielles)
        const reviewData = reviewsRes.data ?? [];
        const memberRows = membersRes.data ?? [];

        const customerIds = [...new Set(reviewData.map((r: any) => r.customer_id).filter(Boolean))] as string[];
        const memberUserIds = [...new Set(memberRows.map((m: any) => m.user_id).filter(Boolean))] as string[];

        const [customerUsersRes, memberUsersRes] = await Promise.all([
            customerIds.length > 0
                ? supabase.from("users").select("id, full_name").in("id", customerIds)
                : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
            memberUserIds.length > 0
                ? supabase.from("users").select("id, full_name, avatar_url").in("id", memberUserIds)
                : Promise.resolve({ data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }),
        ]);

        const customerMap: Record<string, string> = {};
        for (const u of (customerUsersRes.data ?? [])) {
            customerMap[(u as any).id] = (u as any).full_name ?? "Client";
        }

        const memberUsersMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
        for (const u of (memberUsersRes.data ?? [])) {
            memberUsersMap[(u as any).id] = {
                full_name: (u as any).full_name ?? null,
                avatar_url: (u as any).avatar_url ?? null,
            };
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
                // Premium-gated features — only exposed when premium_storefront pack is active
                metaPixelId: hasPremium ? (rest.meta_pixel_id ?? null) : null,
                googleAnalyticsId: hasPremium ? (rest.google_analytics_id ?? null) : null,
                themeLayout: hasPremium ? (rest.theme_layout ?? "grid") : "grid",
                hasPremiumStorefront: hasPremium,
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
            featuredProducts: (productsRes.data ?? [])
                .filter((p: any) => p.is_featured && p.is_available)
                .slice(0, 6)
                .map((p: any) => {
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
            announcements: hasPremium
                ? (announcementsRes.data ?? []).map((a: any) => ({
                    id: a.id,
                    message: a.message,
                    type: a.type,
                    color: a.color,
                }))
                : [],
        }, {
            headers: {
                // CDN cache 60s, serve stale up to 5min while revalidating
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("[GET /api/store/[slug]] error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
