/**
 * KYC routes — migrated from web-dashboard/src/app/api/kyc/
 *
 * GET  /kyc/check-phone?phone=…  — check if MSISDN is active on MTN
 * POST /kyc/verify               — verify identity via MTN KYC
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";

export const kycRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Helper: MTN KYC API ──────────────────────────────────────────
async function checkMsisdnActive(env: Env, phone: string): Promise<{ active: boolean }> {
    const baseUrl = env.MTN_KYC_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const subKey = env.MTN_KYC_SUBSCRIPTION_KEY;
    if (!subKey) return { active: false };

    try {
        const res = await fetch(`${baseUrl}/collection/v1_0/accountholder/msisdn/${phone}/active`, {
            headers: {
                "Ocp-Apim-Subscription-Key": subKey,
                "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
            },
        });
        if (!res.ok) return { active: false };
        const data = (await res.json()) as { result: boolean };
        return { active: data.result ?? false };
    } catch {
        return { active: false };
    }
}

interface KycVerificationRequest {
    msisdn: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    idNumber?: string;
    idType?: string;
    nationality?: string;
}

async function verifyCustomerKyc(env: Env, req: KycVerificationRequest) {
    const baseUrl = env.MTN_KYC_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
    const subKey = env.MTN_KYC_SUBSCRIPTION_KEY;

    // Step 1: Check if MSISDN is active
    const activeCheck = await checkMsisdnActive(env, req.msisdn);

    const fields: Record<string, { requested: boolean; matched: boolean | null }> = {};

    if (req.firstName) fields.firstName = { requested: true, matched: null };
    if (req.lastName) fields.lastName = { requested: true, matched: null };
    if (req.dateOfBirth) fields.dateOfBirth = { requested: true, matched: null };
    if (req.idNumber) fields.idNumber = { requested: true, matched: null };

    // Step 2: If KYC subscription key available, try to get basic info
    if (subKey && activeCheck.active) {
        try {
            const res = await fetch(`${baseUrl}/collection/v1_0/accountholder/msisdn/${req.msisdn}/basicuserinfo`, {
                headers: {
                    "Ocp-Apim-Subscription-Key": subKey,
                    "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
                },
            });
            if (res.ok) {
                const info = (await res.json()) as Record<string, any>;
                if (req.firstName && info.given_name) fields.firstName.matched = info.given_name.toLowerCase() === req.firstName.toLowerCase();
                if (req.lastName && info.family_name) fields.lastName.matched = info.family_name.toLowerCase() === req.lastName.toLowerCase();
                if (req.dateOfBirth && info.birthdate) fields.dateOfBirth.matched = info.birthdate === req.dateOfBirth;
            }
        } catch {
            // Non-blocking
        }
    }

    return {
        status: activeCheck.active ? "verified" : "unverified",
        msisdnActive: activeCheck.active,
        fields,
    };
}

// ═══════════════════════ ROUTES ═══════════════════════════════════

// ── GET /check-phone ─────────────────────────────────────────────
kycRoutes.get("/check-phone", async (c) => {
    const phone = c.req.query("phone");
    if (!phone?.trim()) return c.json({ error: "Le parametre phone est requis" }, 400);

    try {
        const result = await checkMsisdnActive(c.env, phone.trim());
        return c.json({ success: true, phone: phone.trim(), active: result.active });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur verification telephone";
        console.error("GET /kyc/check-phone error:", error);
        return c.json({ error: message }, 502);
    }
});

// ── POST /verify ──────────────────────────────────────────────────
kycRoutes.post("/verify", async (c) => {
    const body = await parseBody<{
        phone: string; firstName?: string; lastName?: string;
        dateOfBirth?: string; idNumber?: string; idType?: string;
    }>(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);

    if (!body.phone?.trim()) return c.json({ error: "Le numero de telephone est requis" }, 400);

    try {
        const result = await verifyCustomerKyc(c.env, {
            msisdn: body.phone.trim(),
            firstName: body.firstName?.trim(),
            lastName: body.lastName?.trim(),
            dateOfBirth: body.dateOfBirth?.trim(),
            idNumber: body.idNumber?.trim(),
            idType: body.idType?.trim(),
            nationality: "CM",
        });

        // Audit trail (non-blocking)
        try {
            if (c.env.SUPABASE_SERVICE_ROLE_KEY) {
                const admin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
                    auth: { autoRefreshToken: false, persistSession: false },
                });
                await admin.from("kyc_verifications").insert({
                    restaurant_id: c.var.restaurantId,
                    user_id: c.var.userId,
                    phone: body.phone.trim(),
                    status: result.status,
                    fields_verified: result.fields,
                    provider: "mtn_kyc_v1",
                    created_at: new Date().toISOString(),
                } as never);
            }
        } catch (auditErr) {
            console.warn("[KYC] Audit log failed:", auditErr);
        }

        return c.json({
            success: true,
            verification: { status: result.status, msisdnActive: result.msisdnActive, fields: result.fields },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur verification KYC";
        console.error("POST /kyc/verify error:", error);
        return c.json({ error: message }, 502);
    }
});
