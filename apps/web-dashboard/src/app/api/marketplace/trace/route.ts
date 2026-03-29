import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/marketplace/trace
 * Liste les traces d'achat agricole du restaurant connecté
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Récupérer le restaurant du user
        const { data: restaurant } = await supabase
            .from("restaurants")
            .select("id")
            .eq("owner_id", user.id)
            .single();

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const page    = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
        const status  = searchParams.get("status");
        const limit   = 20;
        const offset  = (page - 1) * limit;

        let query = (supabase as any)
            .from("supplier_order_traces")
            .select(`
                *,
                suppliers:supplier_id (id, name, phone, region, locality, logo_url),
                supplier_products:product_id (id, name, category, unit, price_per_unit)
            `)
            .eq("restaurant_id", restaurant.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== "all") {
            query = query.eq("delivery_status", status);
        }

        const { data, error } = await query;

        if (error) {
            console.error("GET /api/marketplace/trace error:", error);
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }

        // Calcul rapide CA livré
        const totalDelivered = (data ?? [])
            .filter((t: any) => t.delivery_status === "delivered")
            .reduce((acc: number, t: any) => acc + (t.total_price ?? 0), 0);

        return NextResponse.json({
            success: true,
            traces: data ?? [],
            summary: {
                total: data?.length ?? 0,
                total_delivered_fcfa: totalDelivered,
            },
        });
    } catch (err) {
        console.error("GET /api/marketplace/trace error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/**
 * POST /api/marketplace/trace
 * Enregistre un achat agricole (traçabilité)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { data: restaurant } = await supabase
            .from("restaurants")
            .select("id")
            .eq("owner_id", user.id)
            .single();

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
        }

        const body = await request.json();
        const {
            supplier_id,
            product_id,
            quantity,
            unit,
            unit_price,
            lot_number,
            harvest_date,
            expected_delivery_date,
            notes,
        } = body;

        // Validation basique
        if (!supplier_id || !product_id || !quantity || !unit_price) {
            return NextResponse.json(
                { error: "supplier_id, product_id, quantity et unit_price sont requis" },
                { status: 400 }
            );
        }

        const total_price   = parseFloat(quantity) * parseFloat(unit_price);
        const platform_fee  = +(total_price * 0.03).toFixed(2); // 3% KBouffe

        const { data: trace, error: insertError } = await (supabase as any)
            .from("supplier_order_traces")
            .insert({
                restaurant_id:          restaurant.id,
                supplier_id,
                product_id,
                quantity:               parseFloat(quantity),
                unit:                   unit ?? "",
                unit_price:             parseFloat(unit_price),
                total_price,
                platform_fee,
                lot_number:             lot_number   ?? null,
                harvest_date:           harvest_date ?? null,
                expected_delivery_date: expected_delivery_date ?? null,
                notes:                  notes ?? null,
                delivery_status:        "pending",
            })
            .select(`
                *,
                suppliers:supplier_id (id, name, phone),
                supplier_products:product_id (id, name, category, unit)
            `)
            .single();

        if (insertError) {
            console.error("POST /api/marketplace/trace insert error:", insertError);
            return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
        }

        return NextResponse.json({ success: true, trace }, { status: 201 });
    } catch (err) {
        console.error("POST /api/marketplace/trace error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
