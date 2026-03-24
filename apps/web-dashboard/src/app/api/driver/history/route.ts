/**
 * GET /api/driver/history
 * Historique des commandes livrées par ce livreur (statuts : delivered, completed).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const adminDb = createRawClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
        const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
        const offset = (page - 1) * limit;

        const { data: orders, error, count } = await adminDb
            .from("orders")
            .select(`
                id,
                customer_name,
                delivery_address,
                total,
                status,
                delivered_at,
                created_at,
                updated_at,
                restaurants ( name )
            `, { count: "exact" })
            .eq("driver_id", user.id)
            .in("status", ["delivered", "completed"])
            .order("updated_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            orders: orders ?? [],
            total: count ?? 0,
            page,
            limit,
        });
    } catch (err) {
        console.error("GET /api/driver/history error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
