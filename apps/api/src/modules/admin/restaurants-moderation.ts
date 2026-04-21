import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { getComplianceSnapshot } from "./restaurants-crud";

export const restaurantsModerationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** POST /admin/restaurants/:id/approve — Approve and publish a restaurant */
restaurantsModerationRoutes.post("/:id/approve", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const snapshot = await getComplianceSnapshot(supabase, id, { kycStatusOverride: "approved" });
    if (!snapshot.canPublish) {
        return c.json({
            error: "Publication refusée : le restaurant n'est pas encore conforme.",
            compliance: {
                status: snapshot.complianceStatus,
                blockReason: snapshot.complianceBlockReason,
            },
        }, 422);
    }

    const { data: updated, error } = await supabase
        .from("restaurants")
        .update({
            kyc_status: "approved",
            is_published: true,
            is_verified: true,
            compliance_status: "compliant",
            compliance_block_reason: null,
            compliance_last_checked_at: new Date().toISOString(),
            kyc_reviewed_at: new Date().toISOString(),
            kyc_reviewer_id: c.get("userId"),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, name")
        .single();

    if (error || !updated) return c.json({ error: "Restaurant introuvable ou erreur de mise à jour" }, 500);

    await logAdminAction(c, {
        action: "approve_restaurant",
        targetType: "restaurant",
        targetId: id,
        details: { name: updated.name },
    });

    return c.json({ success: true, id: updated.id, name: updated.name });
});

/** POST /admin/restaurants/:id/block — Block / deactivate a restaurant */
restaurantsModerationRoutes.post("/:id/block", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const reason: string = typeof body.reason === "string" ? body.reason : "";

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data: updated, error } = await supabase
        .from("restaurants")
        .update({
            is_published: false,
            compliance_status: "blocked",
            compliance_block_reason: reason || "Restaurant bloqué par un administrateur",
            compliance_last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, name")
        .single();

    if (error || !updated) return c.json({ error: "Restaurant introuvable ou erreur de mise à jour" }, 500);

    await logAdminAction(c, {
        action: "block_restaurant",
        targetType: "restaurant",
        targetId: id,
        details: { name: updated.name, reason },
    });

    return c.json({ success: true, id: updated.id, name: updated.name });
});
