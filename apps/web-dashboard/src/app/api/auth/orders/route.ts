import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { data: orders, error } = await supabase
            .from("orders")
            .select(`
                id,
                status,
                total,
                created_at,
                delivery_type,
                items,
                restaurant_id,
                restaurants (
                    id,
                    name,
                    slug
                )
            `)
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erreur Supabase fetch orders:", error);
            throw error;
        }

        // Map and format for UI
        const formattedOrders = orders.map((o: any) => ({
            id: o.id,
            restaurantId: o.restaurant_id,
            restaurantName: o.restaurants?.name || "Restaurant inconnu",
            restaurantSlug: o.restaurants?.slug || "",
            total: o.total, // En centimes selon le schema
            itemCount: Array.isArray(o.items) ? o.items.length : 0,
            status: o.status,
            deliveryType: o.delivery_type,
            createdAt: o.created_at,
        }));

        return NextResponse.json(formattedOrders);
    } catch (error) {
        console.error("Erreur API fetch orders:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la récupération des commandes" },
            { status: 500 }
        );
    }
}
