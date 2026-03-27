/**
 * GET /api/store/upsell-suggestions?restaurantId=xxx&cartItems=id1,id2&cartTotal=5000
 * Returns upsell product suggestions based on the restaurant's rules and current cart.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get("restaurantId");
        const cartItemIds = searchParams.get("cartItems")?.split(",").filter(Boolean) ?? [];
        const cartTotal = parseInt(searchParams.get("cartTotal") ?? "0", 10);
        const cartCategoryIds = searchParams.get("cartCategories")?.split(",").filter(Boolean) ?? [];

        if (!restaurantId) {
            return NextResponse.json({ error: "restaurantId requis" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Fetch all active upsell rules for this restaurant
        const { data: rules, error: rulesError } = await supabase
            .from("upsell_rules")
            .select(`
                id,
                trigger_type,
                trigger_product_id,
                trigger_category_id,
                trigger_min_cart,
                suggested_product_id,
                discount_percent,
                custom_message,
                position,
                priority,
                max_suggestions
            `)
            .eq("restaurant_id", restaurantId)
            .eq("is_active", true)
            .order("priority", { ascending: false });

        if (rulesError) {
            console.error("[upsell-suggestions] Error fetching rules:", rulesError);
            return NextResponse.json({ suggestions: [] });
        }

        if (!rules || rules.length === 0) {
            return NextResponse.json({ suggestions: [] });
        }

        // Filter rules that match current cart context
        const matchingRules = rules.filter((rule) => {
            // Don't suggest items already in cart
            if (cartItemIds.includes(rule.suggested_product_id)) return false;

            switch (rule.trigger_type) {
                case "global":
                    return true;
                case "product":
                    return cartItemIds.includes(rule.trigger_product_id!);
                case "category":
                    return cartCategoryIds.includes(rule.trigger_category_id!);
                case "cart_value":
                    return cartTotal >= (rule.trigger_min_cart ?? 0);
                default:
                    return false;
            }
        });

        if (matchingRules.length === 0) {
            return NextResponse.json({ suggestions: [] });
        }

        // Get max_suggestions from highest priority rule (or default 3)
        const maxSuggestions = matchingRules[0]?.max_suggestions ?? 3;

        // Deduplicate by suggested_product_id, keep highest priority
        const seen = new Set<string>();
        const uniqueRules = matchingRules.filter((r) => {
            if (seen.has(r.suggested_product_id)) return false;
            seen.add(r.suggested_product_id);
            return true;
        }).slice(0, maxSuggestions);

        // Fetch product details for suggestions
        const productIds = uniqueRules.map((r) => r.suggested_product_id);
        const { data: products, error: productsError } = await supabase
            .from("products")
            .select("id, name, price, image_url, description")
            .in("id", productIds)
            .eq("is_available", true);

        if (productsError || !products) {
            return NextResponse.json({ suggestions: [] });
        }

        // Build suggestion objects
        const suggestions = uniqueRules
            .map((rule) => {
                const product = products.find((p) => p.id === rule.suggested_product_id);
                if (!product) return null;

                const originalPrice = (product as any).price as number;
                const discountedPrice = rule.discount_percent
                    ? Math.round(originalPrice * (1 - rule.discount_percent / 100))
                    : originalPrice;

                return {
                    ruleId: rule.id,
                    product: {
                        id: (product as any).id,
                        name: (product as any).name,
                        description: (product as any).description,
                        price: originalPrice,
                        discountedPrice,
                        imageUrl: (product as any).image_url,
                    },
                    discountPercent: rule.discount_percent ?? 0,
                    customMessage: rule.custom_message,
                    position: rule.position,
                };
            })
            .filter(Boolean);

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error("[upsell-suggestions] Unexpected error:", error);
        return NextResponse.json({ suggestions: [] });
    }
}
