import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/marketplace/messages
 * - Restaurant : ses messages envoyés
 * - Fournisseur : ses messages reçus (via ?role=supplier)
 *
 * POST /api/marketplace/messages
 * Envoyer un message/devis à un fournisseur (restaurant uniquement)
 */

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const role   = searchParams.get("role") ?? "restaurant"; // "restaurant" | "supplier"
        const status = searchParams.get("status");

        if (role === "supplier") {
            // Fournisseur : messages reçus
            const { data: supplier } = await supabase
                .from("suppliers")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!supplier) {
                return NextResponse.json({ error: "Profil fournisseur introuvable" }, { status: 404 });
            }

            let query = (supabase as any)
                .from("supplier_messages")
                .select(`
                    *,
                    restaurants:restaurant_id (id, name, city, logo_url)
                `)
                .eq("supplier_id", supplier.id)
                .order("created_at", { ascending: false });

            if (status && status !== "all") {
                query = query.eq("status", status);
            }

            const { data, error } = await query;
            if (error) return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });

            const unreadCount = (data ?? []).filter((m: any) => m.status === "unread").length;

            return NextResponse.json({
                success: true,
                messages: data ?? [],
                unread_count: unreadCount,
            });

        } else {
            // Restaurant : messages envoyés
            const { data: restaurant } = await supabase
                .from("restaurants")
                .select("id")
                .eq("owner_id", user.id)
                .single();

            if (!restaurant) {
                return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
            }

            const { data, error } = await (supabase as any)
                .from("supplier_messages")
                .select(`
                    *,
                    suppliers:supplier_id (id, name, phone, region, logo_url)
                `)
                .eq("restaurant_id", restaurant.id)
                .order("created_at", { ascending: false });

            if (error) return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });

            return NextResponse.json({ success: true, messages: data ?? [] });
        }

    } catch (err) {
        console.error("GET /api/marketplace/messages error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

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
            return NextResponse.json({ error: "Seuls les restaurants peuvent envoyer des messages" }, { status: 403 });
        }

        const body = await request.json();
        const { supplier_id, product_id, message_type, subject, body: msgBody, quantity, unit, requested_date } = body;

        if (!supplier_id || !msgBody) {
            return NextResponse.json({ error: "supplier_id et body sont requis" }, { status: 400 });
        }

        const { data: msg, error: insertError } = await (supabase as any)
            .from("supplier_messages")
            .insert({
                restaurant_id:  restaurant.id,
                supplier_id,
                product_id:     product_id ?? null,
                message_type:   message_type ?? "rfq",
                subject:        subject ?? null,
                body:           msgBody,
                quantity:       quantity ? parseFloat(quantity) : null,
                unit:           unit ?? null,
                requested_date: requested_date ?? null,
                status:         "unread",
            })
            .select("id, created_at")
            .single();

        if (insertError) {
            console.error("POST /api/marketplace/messages insert error:", insertError);
            return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: msg }, { status: 201 });
    } catch (err) {
        console.error("POST /api/marketplace/messages error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
