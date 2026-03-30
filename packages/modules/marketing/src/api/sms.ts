/**
 * SMS route — Campagnes marketing restaurateur uniquement
 *
 * POST /sms/send
 *
 * Règle : les SMS ne peuvent être envoyés QUE par un restaurateur authentifié
 * dans le cadre d'une campagne marketing active lui appartenant.
 * Aucun SMS système/plateforme n'est autorisé via cette route.
 *
 * Conformité : Loi n°2010/012 Art.62 — consentement opt-in obligatoire.
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { enqueueSms, CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const smsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

interface SmsPayload {
    recipientMsisdn: string;
    message: string;
    /** Identifiant de la campagne marketing — OBLIGATOIRE */
    campaign_id: string;
}

/** Normalize a phone number to E.164 format (+237XXXXXXXXX) */
function normalizeToE164(msisdn: string): string {
    const digits = msisdn.replace(/\D/g, "");
    if (digits.startsWith("00237")) return `+${digits.slice(2)}`;
    if (digits.startsWith("237")) return `+${digits}`;
    return `+237${digits}`;
}

smsRoutes.post("/send", async (c) => {
    try {
        const body = (await c.req.json()) as SmsPayload;
        const restaurantId = c.var.restaurantId;

        // ── 1. campaign_id obligatoire — seules les campagnes marchands sont autorisées ──
        if (!body.campaign_id?.trim()) {
            return c.json(
                { error: "campaign_id est requis. Les SMS ne peuvent être envoyés que dans le cadre d'une campagne marketing." },
                400,
            );
        }

        // ── 2. Validation de la campagne : doit exister, appartenir au restaurateur et être active ──
        const supabase = createClient(
            c.env.SUPABASE_URL,
            c.env.SUPABASE_SERVICE_ROLE_KEY ?? c.env.SUPABASE_ANON_KEY,
        );

        const now = new Date().toISOString();
        const { data: campaign } = await supabase
            .from("ad_campaigns")
            .select("id, status, starts_at, ends_at, restaurant_id")
            .eq("id", body.campaign_id.trim())
            .eq("restaurant_id", restaurantId)
            .maybeSingle();

        if (!campaign) {
            return c.json(
                { error: "Campagne introuvable ou non autorisée pour ce restaurant." },
                403,
            );
        }

        if (campaign.status !== "active" || campaign.starts_at > now || campaign.ends_at < now) {
            return c.json(
                { error: "La campagne n'est pas active. Vérifiez son statut et ses dates." },
                403,
            );
        }

        // ── 3. Validation du destinataire ──
        if (!body.recipientMsisdn?.trim()) {
            return c.json({ error: "recipientMsisdn est requis" }, 400);
        }

        const msisdnRegex = /^[0-9]{8,15}$/;
        if (!msisdnRegex.test(body.recipientMsisdn.trim())) {
            return c.json({ error: "Format du numéro de téléphone invalide (8-15 chiffres attendus)" }, 400);
        }

        if (!body.message?.trim()) {
            return c.json({ error: "message est requis" }, 400);
        }

        if (body.message.length > 1600) {
            return c.json({ error: "Le message ne doit pas dépasser 1600 caractères" }, 400);
        }

        // ── 4. Consentement SMS opt-in strict (Loi 2010/012 Art.62) ──
        // Le destinataire doit avoir EXPLICITEMENT activé les SMS (opt-in).
        // null ou false = refus. Seul true = consentement valide.
        const normalizedPhone = normalizeToE164(body.recipientMsisdn.trim());

        const { data: user } = await supabase
            .from("users")
            .select("id, sms_notifications_enabled")
            .eq("phone", normalizedPhone)
            .maybeSingle();

        if (!user || user.sms_notifications_enabled !== true) {
            return c.json(
                { error: "Destinataire non inscrit sur KBouffe ou n'ayant pas activé les SMS marketing (opt-in requis — Loi 2010/012 Art.62)." },
                403,
            );
        }

        // ── 5. Envoi en file d'attente ──
        await enqueueSms(c.env, {
            to: normalizedPhone,
            content: body.message.trim(),
        });

        return c.json({ success: true, queued: true, campaign_id: campaign.id });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur envoi SMS";
        console.error("POST /sms/send error:", error);
        return c.json({ error: message }, 502);
    }
});
