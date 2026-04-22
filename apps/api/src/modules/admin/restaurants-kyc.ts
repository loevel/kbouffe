import { Hono } from "hono";
import { z } from "zod";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { licenseUpsertSchema, mapLicenseRow, getComplianceSnapshot, persistComplianceSnapshot } from "./restaurants-crud";

export const restaurantsKycRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /admin/restaurants/kyc-pending — Liste les restaurants avec kyc_status = 'pending', plus anciens en premier */
restaurantsKycRoutes.get("/kyc-pending", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const supabase = c.var.supabase;

    const { data: restaurants, error } = await supabase
        .from("restaurants")
        .select("id, name, owner_id, kyc_submitted_at, kyc_status, compliance_status, compliance_block_reason, created_at")
        .in("kyc_status", ["pending", "documents_submitted"])
        .order("kyc_submitted_at", { ascending: true, nullsFirst: false });

    if (error) return c.json({ error: error.message }, 500);

    const items = restaurants ?? [];
    if (items.length === 0) return c.json({ data: [], total: 0 });

    // Enrich with owner emails
    const ownerIds = [...new Set(items.map((r: any) => r.owner_id).filter(Boolean))];
    const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", ownerIds);

    const userMap = new Map((users ?? []).map((u: any) => [u.id, u]));

    const data = items.map((r: any) => {
        const owner = userMap.get(r.owner_id);
        return {
            id: r.id,
            name: r.name,
            ownerEmail: owner?.email ?? null,
            ownerName: owner?.full_name ?? null,
            submittedAt: r.kyc_submitted_at,
            kycStatus: r.kyc_status,
            complianceStatus: r.compliance_status || "pending",
            complianceBlockReason: r.compliance_block_reason ?? null,
        };
    });

    return c.json({ data, total: data.length });
});

restaurantsKycRoutes.get("/:id/licenses", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;

    const [licensesRes, snapshot] = await Promise.all([
        supabase
            .from("restaurant_licenses")
            .select("id, license_type, license_number, issuing_authority, status, required_for_publication, evidence_url, notes, verified_at, verified_by, expires_at, created_at, updated_at")
            .eq("restaurant_id", id)
            .order("created_at", { ascending: true }),
        getComplianceSnapshot(supabase, id),
    ]);

    return c.json({
        licenses: (licensesRes.data ?? []).map(mapLicenseRow),
        compliance: {
            status: snapshot.complianceStatus,
            blockReason: snapshot.complianceBlockReason,
            canPublish: snapshot.canPublish,
            requiredLicenses: snapshot.requiredLicenses,
            verifiedLicenses: snapshot.verifiedLicenses,
        },
    });
});

restaurantsKycRoutes.put("/:id/licenses", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const parsed = z.object({ licenses: z.array(licenseUpsertSchema).min(1) }).safeParse(body);

    if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, 400);
    }

    const supabase = c.var.supabase;
    const now = new Date().toISOString();

    const rows = parsed.data.licenses.map((license) => ({
        restaurant_id: id,
        license_type: license.license_type,
        license_number: license.license_number,
        issuing_authority: license.issuing_authority,
        status: license.status,
        required_for_publication: license.required_for_publication,
        evidence_url: license.evidence_url ?? null,
        notes: license.notes ?? null,
        expires_at: license.expires_at ?? null,
        updated_at: now,
    }));

    const { error } = await supabase
        .from("restaurant_licenses")
        .upsert(rows, { onConflict: "restaurant_id,license_type" });

    if (error) return c.json({ error: error.message }, 500);

    const snapshot = await persistComplianceSnapshot(supabase, id);
    await logAdminAction(c, {
        action: "update_restaurant_licenses",
        targetType: "restaurant",
        targetId: id,
        details: { licenseTypes: rows.map((row) => row.license_type), complianceStatus: snapshot.complianceStatus },
    });

    const { data: licenses } = await supabase
        .from("restaurant_licenses")
        .select("id, license_type, license_number, issuing_authority, status, required_for_publication, evidence_url, notes, verified_at, verified_by, expires_at, created_at, updated_at")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: true });

    return c.json({
        success: true,
        licenses: (licenses ?? []).map(mapLicenseRow),
        compliance: {
            status: snapshot.complianceStatus,
            blockReason: snapshot.complianceBlockReason,
            canPublish: snapshot.canPublish,
        },
    });
});

restaurantsKycRoutes.get("/:id/kyc/documents/:documentType", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const documentType = c.req.param("documentType");
    const fieldMap: Record<string, string> = {
        niu: "kyc_niu_url",
        rccm: "kyc_rccm_url",
        id: "kyc_id_url",
    };

    const field = fieldMap[documentType];
    if (!field) return c.json({ error: "Type de document invalide" }, 400);

    const supabase = c.var.supabase;
    const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select(field)
        .eq("id", id)
        .maybeSingle();

    if (error || !restaurant) return c.json({ error: "Restaurant introuvable" }, 404);
    const url = (restaurant as any)[field] as string | null;
    if (!url) return c.json({ error: "Document introuvable" }, 404);

    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
        return c.json({ error: "Impossible de charger le document" }, 502);
    }

    const headers = new Headers(upstream.headers);
    headers.set("Cache-Control", "no-store");
    headers.set("Content-Disposition", "inline");
    return new Response(upstream.body, {
        status: upstream.status,
        headers,
    });
});

/** POST /admin/restaurants/:id/kyc/approve — Approve KYC for a restaurant */
restaurantsKycRoutes.post("/:id/kyc/approve", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;
    const snapshot = await getComplianceSnapshot(supabase, id);

    const { data: updated, error } = await supabase
        .from("restaurants")
        .update({
            kyc_status: "approved",
            is_published: snapshot.canPublish,
            is_verified: true,
            compliance_status: snapshot.canPublish ? "compliant" : "in_review",
            compliance_block_reason: snapshot.canPublish ? null : snapshot.complianceBlockReason,
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
        action: "kyc_approve",
        targetType: "restaurant",
        targetId: id,
        details: { name: updated.name },
    });

    await supabase.from("restaurant_notifications").insert({
        restaurant_id: id,
        title: "KYC approuvé ✅",
        body: "Votre dossier KYC a été approuvé. Votre restaurant est maintenant vérifié et publié.",
        type: "kyc_review",
        payload: { status: "approved" },
    });

    return c.json({ success: true, id: updated.id, name: updated.name });
});

/** POST /admin/restaurants/:id/kyc/reject — Reject KYC for a restaurant */
restaurantsKycRoutes.post("/:id/kyc/reject", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const rejectionReason: string =
        typeof body.reason === "string" && body.reason.trim()
            ? body.reason.trim()
            : "Documents non conformes";

    const supabase = c.var.supabase;

    const { data: updated, error } = await supabase
        .from("restaurants")
        .update({
            kyc_status: "rejected",
            kyc_rejection_reason: rejectionReason,
            is_published: false,
            compliance_status: "blocked",
            compliance_block_reason: rejectionReason,
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
        action: "kyc_reject",
        targetType: "restaurant",
        targetId: id,
        details: { name: updated.name, reason: rejectionReason },
    });

    await supabase.from("restaurant_notifications").insert({
        restaurant_id: id,
        title: "KYC rejeté ❌",
        body: `Votre dossier KYC a été rejeté. Motif : ${rejectionReason}`,
        type: "kyc_review",
        payload: { status: "rejected", reason: rejectionReason },
    });

    return c.json({ success: true, id: updated.id, name: updated.name });
});

/** GET /admin/restaurants/:id/kyc/history — Full KYC data with AI analysis and status history */
restaurantsKycRoutes.get("/:id/kyc/history", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;

    const [restaurantRes, historyRes] = await Promise.all([
        supabase
            .from("restaurants")
            .select(`
                id, name, kyc_status, kyc_niu, kyc_rccm, kyc_niu_url, kyc_rccm_url, kyc_id_url,
                kyc_rejection_reason, kyc_submitted_at, kyc_reviewed_at, kyc_reviewer_id,
                kyc_notes, kyc_ai_score, kyc_ai_summary, owner_id
            `)
            .eq("id", id)
            .maybeSingle(),
        supabase
            .from("admin_audit_log")
            .select("id, action, admin_id, details, created_at")
            .eq("target_type", "restaurant")
            .eq("target_id", id)
            .in("action", ["kyc_approve", "kyc_reject", "kyc_request_info", "kyc_approved", "kyc_rejected"])
            .order("created_at", { ascending: false })
            .limit(20),
    ]);

    if (restaurantRes.error || !restaurantRes.data) {
        return c.json({ error: "Restaurant introuvable" }, 404);
    }

    const r = restaurantRes.data;

    // Fetch owner info
    let owner = null;
    if (r.owner_id) {
        const { data: ownerData } = await supabase
            .from("users")
            .select("id, email, full_name, phone")
            .eq("id", r.owner_id)
            .maybeSingle();
        if (ownerData) {
            owner = { id: ownerData.id, email: ownerData.email, fullName: ownerData.full_name, phone: ownerData.phone };
        }
    }

    // Enrich audit history with admin names
    const historyRaw = historyRes.data ?? [];
    const adminIds = [...new Set(historyRaw.map((h: any) => h.admin_id).filter(Boolean))];
    let adminMap = new Map<string, string>();
    if (adminIds.length > 0) {
        const { data: admins } = await supabase
            .from("users")
            .select("id, full_name, email")
            .in("id", adminIds);
        adminMap = new Map((admins ?? []).map((u: any) => [u.id, u.full_name || u.email]));
    }

    const history = historyRaw.map((h: any) => ({
        id: h.id,
        action: h.action,
        adminName: adminMap.get(h.admin_id) ?? "Inconnu",
        details: h.details,
        createdAt: h.created_at,
    }));

    return c.json({
        id: r.id,
        name: r.name,
        kycStatus: r.kyc_status,
        kycNiu: r.kyc_niu,
        kycRccm: r.kyc_rccm,
        kycDocuments: {
            niu: Boolean(r.kyc_niu_url),
            rccm: Boolean(r.kyc_rccm_url),
            id: Boolean(r.kyc_id_url),
        },
        kycRejectionReason: r.kyc_rejection_reason,
        kycSubmittedAt: r.kyc_submitted_at,
        kycReviewedAt: r.kyc_reviewed_at,
        kycNotes: r.kyc_notes,
        kycAiScore: r.kyc_ai_score,
        kycAiSummary: r.kyc_ai_summary,
        owner,
        history,
    });
});

/** POST /admin/restaurants/:id/kyc/request-info — Demander des informations complémentaires */
restaurantsKycRoutes.post("/:id/kyc/request-info", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const { message, missing_documents } = body as { message?: string; missing_documents?: string[] };

    if (!message?.trim()) return c.json({ error: "Le message est requis" }, 400);

    const supabase = c.var.supabase;

    const { data: updated, error } = await supabase
        .from("restaurants")
        .update({
            kyc_status: "incomplete",
            compliance_status: "in_review",
            compliance_block_reason: message.trim(),
            compliance_last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, name")
        .single();

    if (error || !updated) return c.json({ error: "Restaurant introuvable ou erreur de mise à jour" }, 500);

    await logAdminAction(c, {
        action: "kyc_request_info",
        targetType: "restaurant",
        targetId: id,
        details: { name: updated.name, message: message.trim(), missing_documents: missing_documents ?? [] },
    });

    const missingList =
        (missing_documents ?? []).length > 0
            ? `\n\nDocuments manquants : ${(missing_documents ?? []).join(", ")}`
            : "";

    await supabase.from("restaurant_notifications").insert({
        restaurant_id: id,
        title: "Informations complémentaires requises 📋",
        body: `${message.trim()}${missingList}`,
        type: "kyc_request_info",
        payload: { message: message.trim(), missing_documents: missing_documents ?? [] },
    });

    return c.json({ success: true });
});
