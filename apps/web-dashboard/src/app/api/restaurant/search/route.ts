import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SearchResult {
    type: "order" | "product" | "customer";
    id: string;
    title: string;
    subtitle?: string;
    href: string;
}

/**
 * GET /api/restaurant/search?q=query
 *
 * Recherche globale dans :
 *   - Commandes (par numéro ou restaurant)
 *   - Produits (par nom)
 *   - Clients (par nom)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Vérifier authentification
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        // Récupérer le restaurant_id
        const { data: dbUser, error: userError } = await supabase
            .from("users")
            .select("restaurant_id")
            .eq("id", user.id)
            .single();

        if (userError || !dbUser?.restaurant_id) {
            return NextResponse.json(
                { error: "Restaurant non trouvé" },
                { status: 404 }
            );
        }

        const restaurantId = dbUser.restaurant_id;
        const query = request.nextUrl.searchParams.get("q")?.trim() || "";

        if (query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const results: SearchResult[] = [];

        // ════════════════════════════════════════════════════════════════════
        // 1. Rechercher dans les commandes
        // ════════════════════════════════════════════════════════════════════
        const orderPattern = `%${query}%`;

        // Chercher par numéro de commande
        const { data: ordersByNumber } = await supabase
            .from("orders")
            .select("id, order_number, restaurant_id, total_price, created_at")
            .eq("restaurant_id", restaurantId)
            .ilike("order_number", orderPattern)
            .limit(5);

        if (ordersByNumber) {
            ordersByNumber.forEach((order: any) => {
                results.push({
                    type: "order",
                    id: order.id,
                    title: `Commande #${order.order_number}`,
                    subtitle: `${new Intl.NumberFormat("fr-FR").format(order.total_price)} FCFA • ${new Date(order.created_at).toLocaleDateString("fr-FR")}`,
                    href: `/dashboard/orders/${order.id}`,
                });
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // 2. Rechercher dans les produits
        // ════════════════════════════════════════════════════════════════════
        const { data: products } = await supabase
            .from("menu_items")
            .select("id, name, description, base_price, restaurant_id")
            .eq("restaurant_id", restaurantId)
            .ilike("name", orderPattern)
            .limit(5);

        if (products) {
            products.forEach((product: any) => {
                results.push({
                    type: "product",
                    id: product.id,
                    title: product.name,
                    subtitle: product.description ? `${product.description.substring(0, 40)}...` : `${product.base_price} FCFA`,
                    href: `/dashboard/menu/${product.id}`,
                });
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // 3. Rechercher dans les clients/utilisateurs
        // ════════════════════════════════════════════════════════════════════
        // Chercher par prénom
        const { data: customersByFirstName } = await supabase
            .from("customers")
            .select("id, first_name, last_name, email, phone")
            .eq("restaurant_id", restaurantId)
            .ilike("first_name", orderPattern)
            .limit(5);

        const customerIds = new Set<string>();

        if (customersByFirstName) {
            customersByFirstName.forEach((customer: any) => {
                if (!customerIds.has(customer.id)) {
                    customerIds.add(customer.id);
                    const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
                    results.push({
                        type: "customer",
                        id: customer.id,
                        title: fullName || customer.email || "Client",
                        subtitle: customer.phone || customer.email,
                        href: `/dashboard/customers/${customer.id}`,
                    });
                }
            });
        }

        // Chercher par nom de famille
        const { data: customersByLastName } = await supabase
            .from("customers")
            .select("id, first_name, last_name, email, phone")
            .eq("restaurant_id", restaurantId)
            .ilike("last_name", orderPattern)
            .limit(5);

        if (customersByLastName) {
            customersByLastName.forEach((customer: any) => {
                if (!customerIds.has(customer.id)) {
                    customerIds.add(customer.id);
                    const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
                    results.push({
                        type: "customer",
                        id: customer.id,
                        title: fullName || customer.email || "Client",
                        subtitle: customer.phone || customer.email,
                        href: `/dashboard/customers/${customer.id}`,
                    });
                }
            });
        }

        // Chercher par email
        const { data: customersByEmail } = await supabase
            .from("customers")
            .select("id, first_name, last_name, email, phone")
            .eq("restaurant_id", restaurantId)
            .ilike("email", orderPattern)
            .limit(5);

        if (customersByEmail) {
            customersByEmail.forEach((customer: any) => {
                if (!customerIds.has(customer.id)) {
                    customerIds.add(customer.id);
                    const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
                    results.push({
                        type: "customer",
                        id: customer.id,
                        title: fullName || customer.email || "Client",
                        subtitle: customer.phone || customer.email,
                        href: `/dashboard/customers/${customer.id}`,
                    });
                }
            });
        }

        // Limiter le nombre total de résultats
        const limitedResults = results.slice(0, 10);

        return NextResponse.json({ results: limitedResults });
    } catch (error: any) {
        console.error("Erreur recherche:", error);
        return NextResponse.json(
            { error: error.message || "Erreur lors de la recherche" },
            { status: 500 }
        );
    }
}
