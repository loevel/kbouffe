import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminBillingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminBillingRoutes.get("/stats", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const [
        { count: totalPayCount, data: totalPaySum },
        { count: pendingPayCount, data: pendingPaySum },
        { count: completedPayCount, data: completedPaySum },
        { count: totalTxCount },
        { data: commRevSum },
        { data: totalCommSum }
    ] = await Promise.all([
        supabase.from("payouts").select("*", { count: "exact", head: false }),
        supabase.from("payouts").select("*", { count: "exact", head: false }).eq("status", "pending"),
        supabase.from("payouts").select("*", { count: "exact", head: false }).eq("status", "completed"),
        supabase.from("ledger_entries").select("*", { count: "exact", head: true }),
        supabase.from("ledger_entries").select("amount").eq("entry_type", "order_commission").eq("direction", "in"),
        supabase.from("payouts").select("commission_amount")
    ]);

    const sumAmount = (list: any[], key: string = "amount") => list?.reduce((acc, curr) => acc + (curr[key] || 0), 0) || 0;

    return c.json({
        payouts: { 
            total: totalPayCount || 0, 
            totalAmount: sumAmount(totalPaySum || []), 
            pending: pendingPayCount || 0, 
            pendingAmount: sumAmount(pendingPaySum || []), 
            completed: completedPayCount || 0, 
            completedAmount: sumAmount(completedPaySum || []) 
        },
        transactions: { total: totalTxCount || 0 },
        commissionRevenue: sumAmount(commRevSum || []),
        totalCommission: sumAmount(totalCommSum || [], "commission_amount"),
    });
});

adminBillingRoutes.get("/transactions", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const typeFilter = c.req.query("type") ?? "all";
    const directionFilter = c.req.query("direction") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));

    let query = supabase
        .from("ledger_entries")
        .select("*, restaurant:restaurants(name)", { count: "exact" });

    if (typeFilter !== "all") query = query.eq("entry_type", typeFilter);
    if (directionFilter !== "all") query = query.eq("direction", directionFilter);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count: total, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Supabase Transactions Error:", error);
        return c.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const formattedData = (data || []).map((t: any) => ({
        id: t.id,
        restaurantId: t.restaurant_id,
        type: t.entry_type,
        direction: t.direction,
        amount: t.amount,
        description: t.description,
        createdAt: t.created_at,
        restaurantName: t.restaurant?.name
    }));

    return c.json({ 
        data: formattedData, 
        pagination: { 
            page, 
            limit, 
            total: total ?? 0, 
            totalPages: Math.ceil((total ?? 0) / limit) 
        } 
    });
});

adminBillingRoutes.get("/payouts", async (c) => {
    const denied = requireDomain(c, "billing:read");
    if (denied) return denied;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const statusFilter = c.req.query("status") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));
    const sortOrder = c.req.query("order") ?? "desc";

    let query = supabase
        .from("payouts")
        .select("*, restaurant:restaurants(name, slug)", { count: "exact" });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count: total, error } = await query
        .order("created_at", { ascending: sortOrder === "asc" })
        .range(from, to);

    if (error) {
        console.error("Supabase Payouts Error:", error);
        return c.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const formattedData = (data || []).map((p: any) => ({
        id: p.id,
        restaurantId: p.restaurant_id,
        amount: p.amount,
        commissionAmount: p.commission_amount,
        grossAmount: p.gross_amount,
        status: p.status,
        paymentMethod: p.payment_method,
        paymentReference: p.payment_reference,
        recipientPhone: p.recipient_phone,
        recipientName: p.recipient_name,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        notes: p.notes,
        createdAt: p.created_at,
        processedAt: p.processed_at,
        completedAt: p.completed_at,
        restaurantName: p.restaurant?.name,
        restaurantSlug: p.restaurant?.slug,
    }));

    return c.json({ 
        data: formattedData, 
        pagination: { 
            page, 
            limit, 
            total: total ?? 0, 
            totalPages: Math.ceil((total ?? 0) / limit) 
        } 
    });
});

adminBillingRoutes.patch("/payouts", async (c) => {
    const denied = requireDomain(c, "billing:write");
    if (denied) return denied;
    
    const body = await c.req.json();
    if (!body.id || !body.status) return c.json({ error: "id et status requis" }, 400);

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    
    if (!["processing", "completed", "failed"].includes(body.status)) return c.json({ error: "Statut invalide" }, 400);
    
    const updates: Record<string, any> = { 
        status: body.status, 
        processed_by: c.var.userId 
    };

    if (body.status === "processing") updates.processed_at = new Date().toISOString();
    if (body.status === "completed") updates.completed_at = new Date().toISOString();
    if (body.paymentReference) updates.payment_reference = body.paymentReference;

    const { data: updated, error } = await supabase
        .from("payouts")
        .update(updates)
        .eq("id", body.id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { action: "update_payout", targetType: "payout", targetId: body.id, details: { status: body.status } });

    return c.json(updated);
});
