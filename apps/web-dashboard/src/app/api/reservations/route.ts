import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { ctx, error } = await withAuth();
  if (error) return error;

  try {
    const adminClient = await createAdminClient();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const date = url.searchParams.get("date");

    let query = adminClient
      .from("reservations")
      .select(
        `
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
        table_zones!reservations_zone_id_fkey (
          id,
          name
        ),
        restaurant_tables (
          id,
          number
        )
        `,
        { count: "exact" }
      )
      .eq("restaurant_id", ctx.restaurantId)
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`
      );
    }

    if (date) {
      query = query.eq("date", date);
    }

    const { data: reservations, error: dbError, count } = await query;

    if (dbError) {
      console.error("Erreur Supabase fetch reservations:", dbError);
      throw dbError;
    }

    return NextResponse.json({
      reservations: reservations ?? [],
      total: count ?? 0,
    });
  } catch (err) {
    console.error("Erreur API fetch reservations:", err);
    return apiError("Erreur serveur lors de la récupération des réservations");
  }
}

export async function PATCH(request: Request) {
  const { ctx, error } = await withAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const adminClient = await createAdminClient();

    // Verify reservation belongs to this restaurant
    const { data: reservation, error: fetchError } = await adminClient
      .from("reservations")
      .select("id")
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .maybeSingle();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const { error: updateError } = await adminClient
      .from("reservations")
      .update({ status })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur API update reservation:", err);
    return apiError("Erreur serveur lors de la mise à jour");
  }
}

export async function DELETE(request: Request) {
  const { ctx, error } = await withAuth();
  if (error) return error;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de réservation requis" }, { status: 400 });
    }

    const adminClient = await createAdminClient();

    // Verify reservation belongs to this restaurant
    const { data: reservation } = await adminClient
      .from("reservations")
      .select("id")
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .maybeSingle();

    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const { error: deleteError } = await adminClient
      .from("reservations")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur API delete reservation:", err);
    return apiError("Erreur serveur lors de la suppression");
  }
}
