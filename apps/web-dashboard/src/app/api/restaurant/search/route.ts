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
 * Recherche globale dans : commandes, produits, clients
 * Scoped au restaurant du marchand authentifié.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Résolution du restaurant_id via users.restaurant_id
        const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("restaurant_id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError || !profile?.restaurant_id) {
            return NextResponse.json({ error: "Restaurant non trouvé" }, { status: 404 });
        }

        const restaurantId = profile.restaurant_id as string;

        // Strip leading # so "#A3F2C1" and "A3F2C1" both work
        const q = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/^#/, "");

        if (q.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const pattern = `%${q}%`;

        // 3 requêtes parallèles — toutes scopées au restaurant
        const [ordersRes, productsRes, customersRes] = await Promise.all([
            // Commandes : par nom ou téléphone client
            supabase
                .from("orders")
                .select("id, status, total, customer_name, customer_phone, created_at")
                .eq("restaurant_id", restaurantId)
                .or(`customer_name.ilike.${pattern},customer_phone.ilike.${pattern}`)
                .order("created_at", { ascending: false })
                .limit(5),

            // Produits : par nom
            supabase
                .from("products")
                .select("id, name, price")
                .eq("restaurant_id", restaurantId)
                .ilike("name", pattern)
                .limit(5),

            // Clients dédupliqués depuis les commandes du restaurant
            supabase
                .from("orders")
                .select("customer_id, customer_name, customer_phone")
                .eq("restaurant_id", restaurantId)
                .or(`customer_name.ilike.${pattern},customer_phone.ilike.${pattern}`)
                .not("customer_id", "is", null)
                .limit(10),
        ]);

        const results: SearchResult[] = [];

        // Commandes
        for (const o of ordersRes.data ?? []) {
            const shortId = (o.id as string).slice(-6).toUpperCase();
            results.push({
                type: "order",
                id: o.id as string,
                title: `Commande #${shortId}`,
                subtitle: `${o.customer_name ?? "Client"} — ${new Intl.NumberFormat("fr-FR").format(o.total as number)} FCFA`,
                href: `/dashboard/orders?highlight=${o.id}`,
            });
        }

        // Produits
        for (const p of productsRes.data ?? []) {
            results.push({
                type: "product",
                id: p.id as string,
                title: p.name as string,
                subtitle: `${new Intl.NumberFormat("fr-FR").format(p.price as number)} FCFA`,
                href: `/dashboard/menu?highlight=${p.id}`,
            });
        }

        // Clients (dédupliqués par customer_id)
        const seen = new Set<string>();
        for (const row of customersRes.data ?? []) {
            const cid = row.customer_id as string;
            if (!seen.has(cid)) {
                seen.add(cid);
                results.push({
                    type: "customer",
                    id: cid,
                    title: (row.customer_name ?? "Client inconnu") as string,
                    subtitle: (row.customer_phone ?? undefined) as string | undefined,
                    href: `/dashboard/customers?id=${cid}`,
                });
            }
            if (seen.size >= 3) break;
        }

        return NextResponse.json({ results: results.slice(0, 10) });
    } catch (error: unknown) {
        console.error("Erreur recherche:", error);
        return NextResponse.json(
            { error: "Erreur lors de la recherche" },
            { status: 500 }
        );
    }
}

