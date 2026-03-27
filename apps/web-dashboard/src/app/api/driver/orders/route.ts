/**
 * GET /api/driver/orders
 * Retourne les commandes actives assignées au livreur connecté
 * (statuts: ready, out_for_delivery, delivering).
 */
import { NextResponse } from "next/server";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Use raw admin client to bypass RLS on joined tables
        const adminDb = createRawClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: orders, error } = await adminDb
            .from("orders")
            .select(`
                id,
                customer_name,
                customer_phone,
                delivery_address,
                items,
                total,
                delivery_fee,
                status,
                notes,
                created_at,
                restaurant_id,
                restaurants ( name, address, phone )
            `)
            .eq("driver_id", user.id)
            .in("status", ["ready", "out_for_delivery", "delivering"])
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Driver orders query error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders: orders ?? [] });
    } catch (err) {
        console.error("GET /api/driver/orders error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
