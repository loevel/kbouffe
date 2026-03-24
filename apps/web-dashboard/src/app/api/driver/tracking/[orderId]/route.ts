/**
 * GET  /api/driver/tracking/[orderId] — Get tracking session for this order
 * POST /api/driver/tracking/[orderId] — Update driver GPS position
 * PUT  /api/driver/tracking/[orderId] — Start/init tracking session
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ orderId: string }>;

function getAdminDb() {
    return createRawClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

async function authenticateDriver() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

/**
 * GET — Get tracking data for an order assigned to this driver.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const user = await authenticateDriver();
        if (!user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { orderId } = await params;
        const adminDb = getAdminDb();

        // Verify order is assigned to this driver
        const { data: order } = await adminDb
            .from("orders")
            .select("id")
            .eq("id", orderId)
            .eq("driver_id", user.id)
            .maybeSingle();

        if (!order) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        const { data: tracking } = await adminDb
            .from("delivery_tracking")
            .select("order_id, client_lat, client_lng, client_address, deliverer_lat, deliverer_lng, deliverer_name, status, started_at, updated_at")
            .eq("order_id", orderId)
            .maybeSingle();

        return NextResponse.json({ tracking: tracking ?? null });
    } catch (err) {
        console.error("GET /api/driver/tracking/[orderId] error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/**
 * POST — Driver updates their GPS position.
 * Body: { lat: number, lng: number }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const user = await authenticateDriver();
        if (!user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { orderId } = await params;
        const body = await request.json();
        const { lat, lng } = body;

        if (typeof lat !== "number" || typeof lng !== "number") {
            return NextResponse.json({ error: "lat et lng requis (number)" }, { status: 400 });
        }

        const adminDb = getAdminDb();

        // Verify order is assigned to this driver
        const { data: order } = await adminDb
            .from("orders")
            .select("id")
            .eq("id", orderId)
            .eq("driver_id", user.id)
            .maybeSingle();

        if (!order) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        const driverName = user.user_metadata?.full_name ?? user.email ?? "Livreur";

        const { data: tracking, error } = await adminDb
            .from("delivery_tracking")
            .update({
                deliverer_lat: lat,
                deliverer_lng: lng,
                deliverer_name: driverName,
            })
            .eq("order_id", orderId)
            .select()
            .single();

        if (error) {
            console.error("Error updating driver position:", error);
            return NextResponse.json({ error: "Erreur de mise à jour" }, { status: 500 });
        }

        return NextResponse.json({ tracking });
    } catch (err) {
        console.error("POST /api/driver/tracking/[orderId] error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/**
 * PUT — Driver starts/initializes a tracking session.
 */
export async function PUT(
    _request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const user = await authenticateDriver();
        if (!user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { orderId } = await params;
        const adminDb = getAdminDb();

        // Verify order is assigned to this driver
        const { data: order } = await adminDb
            .from("orders")
            .select("id, restaurant_id, delivery_address")
            .eq("id", orderId)
            .eq("driver_id", user.id)
            .maybeSingle();

        if (!order) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        const driverName = user.user_metadata?.full_name ?? user.email ?? "Livreur";

        const { data: tracking, error } = await adminDb
            .from("delivery_tracking")
            .upsert({
                order_id: orderId,
                restaurant_id: (order as any).restaurant_id,
                client_address: (order as any).delivery_address ?? null,
                deliverer_name: driverName,
                status: "active",
                started_at: new Date().toISOString(),
            }, { onConflict: "order_id" })
            .select()
            .single();

        if (error) {
            console.error("Error creating tracking session:", error);
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }

        return NextResponse.json({ tracking }, { status: 201 });
    } catch (err) {
        console.error("PUT /api/driver/tracking/[orderId] error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
