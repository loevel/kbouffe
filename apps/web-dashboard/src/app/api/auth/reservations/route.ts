import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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

        // Use admin client to bypass RLS (user is already authenticated above)
        const adminClient = await createAdminClient();

        // Fetch reservations linked to the user (by customer_id OR by phone/email match)
        const phone = user.phone ?? null;
        const email = user.email ?? null;

        let query = adminClient
            .from("reservations")
            .select(`
                id,
                restaurant_id,
                customer_name,
                customer_phone,
                customer_email,
                party_size,
                date,
                time,
                duration,
                status,
                occasion,
                zone_id,
                table_id,
                special_requests,
                cancellation_reason,
                created_at,
                restaurants (
                    id,
                    name,
                    slug,
                    logo_url
                ),
                table_zones!reservations_zone_id_fkey (
                    id,
                    name,
                    type,
                    color,
                    image_url
                ),
                restaurant_tables (
                    number
                )
            `)
            .order("date", { ascending: false })
            .order("time", { ascending: false });

        // Build OR filter: customer_id match, or phone match, or email match
        const filters: string[] = [`customer_id.eq.${user.id}`];
        if (phone) filters.push(`customer_phone.eq.${phone}`);
        if (email) filters.push(`customer_email.eq.${email}`);
        query = query.or(filters.join(","));

        const { data: reservations, error } = await query;

        if (error) {
            console.error("Erreur Supabase fetch reservations:", error);
            throw error;
        }

        return NextResponse.json(reservations ?? []);
    } catch (error) {
        console.error("Erreur API fetch reservations:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la récupération des réservations" },
            { status: 500 },
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await request.json();
        const { id, action } = body;

        if (!id || action !== "cancel") {
            return NextResponse.json({ error: "Action invalide" }, { status: 400 });
        }

        // Use admin client to bypass RLS
        const adminClient = await createAdminClient();

        // Verify the reservation belongs to this user
        const { data: reservation, error: fetchError } = await adminClient
            .from("reservations")
            .select("id, customer_id, customer_phone, customer_email, status")
            .eq("id", id)
            .maybeSingle();

        if (fetchError || !reservation) {
            return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
        }

        // Check ownership
        const phone = user.phone ?? null;
        const email = user.email ?? null;
        const isOwner =
            reservation.customer_id === user.id ||
            (phone && reservation.customer_phone === phone) ||
            (email && reservation.customer_email === email);

        if (!isOwner) {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        // Only cancel pending or confirmed
        if (!["pending", "confirmed"].includes(reservation.status ?? "")) {
            return NextResponse.json(
                { error: "Cette réservation ne peut plus être annulée" },
                { status: 400 },
            );
        }

        const { error: updateError } = await adminClient
            .from("reservations")
            .update({
                status: "cancelled",
                cancellation_reason: "Annulée par le client",
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erreur API cancel reservation:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de l'annulation" },
            { status: 500 },
        );
    }
}
