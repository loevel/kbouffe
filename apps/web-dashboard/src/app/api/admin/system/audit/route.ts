/**
 * GET  /api/admin/system/audit  — paginated audit logs with filtering
 * POST /api/admin/system/audit  — log an admin action (internal use)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const { supabase } = auth.ctx;
    const db = supabase as any;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search");
    const admin_id = searchParams.get("admin_id");
    const action = searchParams.get("action");
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");

    // Build query
    let query = db
        .from("audit_logs")
        .select(
            "id, admin_id, action, target_type, target_id, details, ip_address, user_agent, created_at",
            { count: "exact" }
        );

    // Filters
    if (admin_id) query = query.eq("admin_id", admin_id);
    if (action && action !== "all") query = query.eq("action", action);
    if (search) {
        // Search across action, target_id, ip_address
        query = query.or(
            `action.ilike.%${search}%,target_id.ilike.%${search}%,ip_address.ilike.%${search}%`
        );
    }
    if (date_from) {
        const from = new Date(date_from).toISOString();
        query = query.gte("created_at", from);
    }
    if (date_to) {
        const to = new Date(date_to);
        to.setHours(23, 59, 59, 999);
        query = query.lte("created_at", to.toISOString());
    }

    query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
        console.error("[GET /api/admin/system/audit]", error);
        return apiError("Erreur de chargement des journaux d'audit");
    }

    // Fetch admin details (name, email, role) for each log
    const adminIds = [...new Set((logs ?? []).map((l: any) => l.admin_id).filter(Boolean))];
    const adminMap: Record<
        string,
        { full_name: string | null; email: string | null; admin_role: string | null }
    > = {};

    if (adminIds.length > 0) {
        const { data: admins } = await db
            .from("users")
            .select("id, full_name, email, admin_role")
            .in("id", adminIds);

        (admins ?? []).forEach((a: any) => {
            adminMap[a.id] = {
                full_name: a.full_name ?? null,
                email: a.email ?? null,
                admin_role: a.admin_role ?? null,
            };
        });
    }

    // Map response
    const result = (logs ?? []).map((log: any) => {
        const admin = adminMap[log.admin_id] ?? {
            full_name: null,
            email: null,
            admin_role: null,
        };

        return {
            id: log.id,
            adminId: log.admin_id,
            adminName: admin.full_name,
            adminEmail: admin.email,
            adminRole: admin.admin_role,
            action: log.action,
            targetType: log.target_type,
            targetId: log.target_id,
            details: log.details,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            createdAt: log.created_at,
        };
    });

    const total = count ?? 0;

    return NextResponse.json({
        logs: result,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
}

export async function POST(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const { supabase, userId } = auth.ctx;
    const db = supabase as any;

    try {
        const body = await request.json();
        const {
            action,
            target_type,
            target_id,
            details = null,
            ip_address = null,
            user_agent = null,
        } = body;

        if (!action || !target_type || !target_id) {
            return apiError(
                "Paramètres requis: action, target_type, target_id",
                400
            );
        }

        const { error } = await db.from("audit_logs").insert({
            admin_id: userId,
            action,
            target_type,
            target_id,
            details,
            ip_address,
            user_agent,
        });

        if (error) {
            console.error("[POST /api/admin/system/audit]", error);
            return apiError("Erreur lors de l'enregistrement de l'audit");
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/admin/system/audit] unexpected:", err);
        return apiError("Erreur serveur");
    }
}
