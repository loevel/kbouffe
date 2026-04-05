import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch restaurant ID
        const { data: restaurant } = await supabase
            .from("restaurants")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!restaurant) {
            return Response.json({ error: "Restaurant not found" }, { status: 404 });
        }

        const restaurantId = restaurant.id;

        // Fetch orders
        const { data: orders, count: ordersCount } = await supabase
            .from("orders")
            .select("total", { count: "exact" })
            .eq("restaurant_id", restaurantId);

        // Fetch reviews
        const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("restaurant_id", restaurantId);

        // Fetch customers (unique user_ids from orders)
        const { data: customersData, count: customersCount } = await supabase
            .from("orders")
            .select("customer_id", { count: "exact" })
            .eq("restaurant_id", restaurantId)
            .not("customer_id", "is", null);

        const totalRevenue = (orders ?? []).reduce((sum, o) => sum + ((o.total as number) || 0), 0);
        const avgRating =
            reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating as number), 0) / reviews.length : 0;
        const avgOrderValue = ordersCount && ordersCount > 0 ? totalRevenue / ordersCount : 0;

        const metrics = {
            totalOrders: ordersCount ?? 0,
            totalRevenue,
            avgRating: Number(avgRating.toFixed(1)),
            totalReviews: reviews?.length ?? 0,
            totalCustomers: customersCount ?? 0,
            avgOrderValue: Math.round(avgOrderValue),
            completionRate: 95, // Placeholder
            avgDeliveryTime: 28, // Placeholder (minutes)
        };

        return Response.json({ metrics });
    } catch (error) {
        console.error("Error fetching metrics:", error);
        return Response.json({
            metrics: {
                totalOrders: 0,
                totalRevenue: 0,
                avgRating: 0,
                totalReviews: 0,
                totalCustomers: 0,
                avgOrderValue: 0,
                completionRate: 0,
                avgDeliveryTime: 0,
            },
        });
    }
}
