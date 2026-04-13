/**
 * GET /api/admin/system/audit/stats — aggregated audit statistics
 * Returns: today count, thisWeek count, activeAdmins, topAdmins, topActions, mostFrequentAction
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const { supabase } = auth.ctx;
    const db = supabase as any;

    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // ── Today count ──
        const { count: todayCount, error: todayError } = await db
            .from("audit_logs")
            .select("id", { count: "exact" })
            .gte("created_at", today.toISOString())
            .lt("created_at", new Date(today.getTime() + 86400000).toISOString());

        if (todayError) throw todayError;

        // ── This week count ──
        const { count: weekCount, error: weekError } = await db
            .from("audit_logs")
            .select("id", { count: "exact" })
            .gte("created_at", weekAgo.toISOString());

        if (weekError) throw weekError;

        // ── Active admins (this week) ──
        const { data: activeAdminsData, error: activeError } = await db
            .from("audit_logs")
            .select("admin_id")
            .gte("created_at", weekAgo.toISOString());

        if (activeError) throw activeError;

        const activeAdminsSet = new Set(
            (activeAdminsData ?? [])
                .map((log: any) => log.admin_id)
                .filter(Boolean)
        );
        const activeAdmins = activeAdminsSet.size;

        // ── Top actions (all time) ──
        const { data: allActions, error: actionsError } = await db
            .from("audit_logs")
            .select("action");

        if (actionsError) throw actionsError;

        const actionCounts = new Map<string, number>();
        (allActions ?? []).forEach((log: any) => {
            const action = log.action;
            actionCounts.set(action, (actionCounts.get(action) ?? 0) + 1);
        });

        const topActions = Array.from(actionCounts.entries())
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const mostFrequentAction = topActions.length > 0 ? topActions[0].action : null;

        // ── Top admins (all time) ──
        const { data: allAdmins, error: adminsError } = await db
            .from("audit_logs")
            .select("admin_id")
            .not("admin_id", "is", null);

        if (adminsError) throw adminsError;

        const adminCounts = new Map<string, number>();
        (allAdmins ?? []).forEach((log: any) => {
            const id = log.admin_id;
            if (id) adminCounts.set(id, (adminCounts.get(id) ?? 0) + 1);
        });

        const adminIds = Array.from(adminCounts.keys());
        const { data: adminDetails } = await db
            .from("users")
            .select("id, full_name, email, admin_role")
            .in("id", adminIds);

        const adminMap = new Map<
            string,
            { full_name: string | null; email: string | null; admin_role: string | null }
        >();
        (adminDetails ?? []).forEach((a: any) => {
            adminMap.set(a.id, {
                full_name: a.full_name ?? null,
                email: a.email ?? null,
                admin_role: a.admin_role ?? null,
            });
        });

        const topAdmins = Array.from(adminCounts.entries())
            .map(([id, count]) => {
                const details = adminMap.get(id) ?? {
                    full_name: null,
                    email: null,
                    admin_role: null,
                };
                return {
                    id,
                    name: details.full_name,
                    email: details.email,
                    role: details.admin_role,
                    count,
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return NextResponse.json({
            today: todayCount ?? 0,
            thisWeek: weekCount ?? 0,
            activeAdmins,
            mostFrequentAction,
            topAdmins,
            topActions,
        });
    } catch (error) {
        console.error("[GET /api/admin/system/audit/stats]", error);
        return apiError("Erreur lors du calcul des statistiques");
    }
}
