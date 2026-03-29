/**
 * GET /api/export/user
 * Exporte toutes les données personnelles de l'utilisateur authentifié.
 *
 * Conforme à la Loi camerounaise n°2010/012 Art. 48
 * — Droit d'accès aux données personnelles.
 *
 * Contenu : profil utilisateur, commandes (sans PII tiers),
 *           adresses, favoris (restaurants + produits), mouvements wallet.
 *
 * Exclut : données d'autres utilisateurs, secrets de plateforme.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();

    // ── Authentification ───────────────────────────────────────────────────────
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const db = supabase as any;
    const userId = user.id;

    try {
        // ── Récupération parallèle des données ─────────────────────────────────
        const [
            profileRes,
            ordersRes,
            addressesRes,
            favRestaurantsRes,
            favProductsRes,
            walletRes,
        ] = await Promise.all([
            // Profil utilisateur (sans champ mot de passe)
            db
                .from("users")
                .select("id, email, full_name, phone, avatar_url, created_at, updated_at")
                .eq("id", userId)
                .maybeSingle(),

            // Commandes — on exclut les PII tiers (infos livreur, etc.)
            db
                .from("orders")
                .select(
                    `id, status, delivery_type, total_amount, delivery_fee,
                     special_instructions, created_at, updated_at,
                     order_items(id, product_id, quantity, unit_price, total_price, notes)`
                )
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

            // Adresses de livraison
            db
                .from("addresses")
                .select("id, label, address_line, city, quarter, is_default, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

            // Restaurants favoris
            db
                .from("favorite_restaurants")
                .select("id, restaurant_id, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

            // Produits favoris
            db
                .from("favorite_products")
                .select("id, product_id, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

            // Mouvements du wallet (crédit, débit, remboursements)
            db
                .from("wallet_movements")
                .select("id, type, amount, description, reference, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),
        ]);

        // ── Construction du payload ─────────────────────────────────────────────
        const exportData = {
            export_metadata: {
                version: "1.0",
                exported_at: new Date().toISOString(),
                user_id: userId,
                platform: "kBouffe",
                legal_note:
                    "Export conforme Loi camerounaise n°2010/012 Art.48 — Droit d'accès aux données personnelles.",
            },
            profile: profileRes.data ?? null,
            statistics: {
                total_orders: ordersRes.data?.length ?? 0,
                total_addresses: addressesRes.data?.length ?? 0,
                favorite_restaurants: favRestaurantsRes.data?.length ?? 0,
                favorite_products: favProductsRes.data?.length ?? 0,
                wallet_movements: walletRes.data?.length ?? 0,
            },
            orders: ordersRes.data ?? [],
            addresses: addressesRes.data ?? [],
            favorites: {
                restaurants: favRestaurantsRes.data ?? [],
                products: favProductsRes.data ?? [],
            },
            wallet_movements: walletRes.data ?? [],
        };

        // ── Nom du fichier horodaté ─────────────────────────────────────────────
        const date = new Date().toISOString().split("T")[0];
        const filename = `kbouffe-mes-donnees-${date}.json`;

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "X-Export-User": userId,
                "X-Export-Rows": String(
                    (ordersRes.data?.length ?? 0) +
                    (addressesRes.data?.length ?? 0) +
                    (walletRes.data?.length ?? 0)
                ),
            },
        });
    } catch (err) {
        console.error("[GET /api/export/user]", err);
        return NextResponse.json(
            { error: "Erreur lors de la génération de l'export" },
            { status: 500 }
        );
    }
}
