/**
 * GET /api/restaurant/notifications — Restaurant notifications feed
 * POST /api/restaurant/notifications — Mark notifications as read
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20");
        const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0");

        // Fetch notifications
        const { data: notifications, error } = await ctx.supabase
            .from("restaurant_notifications")
            .select("*")
            .eq("restaurant_id", ctx.restaurantId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Notifications query error:", error);
            return apiError("Erreur lors du chargement des notifications");
        }

        // Unread count
        const { count: unreadCount } = await ctx.supabase
            .from("restaurant_notifications")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", ctx.restaurantId)
            .eq("is_read", false);

        return NextResponse.json({
            notifications: notifications ?? [],
            unreadCount: unreadCount ?? 0,
        });
    } catch (error) {
        console.error("GET /api/restaurant/notifications error:", error);
        return apiError("Erreur serveur");
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const body = await request.json();
        const { ids } = body as { ids?: string[] };

        if (ids && ids.length > 0) {
            // Mark specific notifications as read
            await ctx.supabase
                .from("restaurant_notifications")
                .update({ is_read: true })
                .eq("restaurant_id", ctx.restaurantId)
                .in("id", ids);
        } else {
            // Mark all as read
            await ctx.supabase
                .from("restaurant_notifications")
                .update({ is_read: true })
                .eq("restaurant_id", ctx.restaurantId)
                .eq("is_read", false);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("POST /api/restaurant/notifications error:", error);
        return apiError("Erreur serveur");
    }
}
