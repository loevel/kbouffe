/**
 * GET /api/orders       — List orders for the merchant's restaurant
 * POST /api/orders      — Create a new order (for testing / mobile client)
 *
 * Supports: ?status=pending&search=...&sort=newest&payment=paid&delivery=delivery&page=1&limit=10
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

interface OrderRow {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  items: unknown;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  corkage_fee: number;
  tip_amount: number;
  total: number;
  status: string;
  delivery_type: string;
  delivery_address: string | null;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  table_number: string | null;
  table_id: string | null;
  covers: number | null;
  external_drinks_count: number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const sort = url.searchParams.get("sort") ?? "newest";
    const payment = url.searchParams.get("payment");
    const delivery = url.searchParams.get("delivery");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(0, parseInt(url.searchParams.get("limit") ?? "50", 10)));

    // Build Supabase query
    let query = ctx.supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("restaurant_id", ctx.restaurantId);

    if (status) {
      query = query.eq("status", status as any);
    }
    if (payment) {
      query = query.eq("payment_status", payment as any);
    }
    if (delivery) {
      query = query.eq("delivery_type", delivery as any);
    }
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,id.ilike.%${search}%`
      );
    }

    // Sort
    switch (sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "amount_desc":
        query = query.order("total", { ascending: false });
        break;
      case "amount_asc":
        query = query.order("total", { ascending: true });
        break;
      default: // newest
        query = query.order("created_at", { ascending: false });
    }

    // Pagination (limit=0 means count only)
    if (limit > 0) {
      query = query.range((page - 1) * limit, page * limit - 1);
    } else {
      query = query.limit(0);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Orders query error:", error);
      return apiError("Erreur lors de la récupération des commandes");
    }

    return NextResponse.json({
      orders: (data as unknown as OrderRow[]) ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return apiError("Erreur serveur");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const body = await request.json();

    const orderData = {
      restaurant_id: ctx.restaurantId,
      customer_id: body.customer_id ?? null,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      items: body.items,
      subtotal: body.subtotal,
      delivery_fee: body.delivery_fee ?? 0,
      service_fee: body.service_fee ?? 0,
      corkage_fee: body.corkage_fee ?? 0,
      tip_amount: body.tip_amount ?? 0,
      total: body.total,
      status: "pending" as const,
      delivery_type: body.delivery_type ?? "delivery",
      delivery_address: body.delivery_address ?? null,
      payment_method: body.payment_method,
      payment_status: body.payment_status ?? "pending",
      notes: body.notes ?? null,
      // Dine-in fields
      table_number: body.table_number ?? null,
      table_id: body.table_id ?? null,
      covers: body.covers ?? null,
      external_drinks_count: body.external_drinks_count ?? 0,
      // Scheduled order
      scheduled_for: body.scheduled_for ?? null,
    };

    const { data, error } = await ctx.supabase
      .from("orders")
      .insert(orderData as any)
      .select()
      .single();

    if (error) {
      console.error("Create order error:", error);
      return apiError("Erreur lors de la création de la commande");
    }

    return NextResponse.json({ success: true, order: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return apiError("Erreur serveur");
  }
}
