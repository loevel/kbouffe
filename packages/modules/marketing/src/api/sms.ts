/**
 * SMS route
 * POST /sms/send
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { enqueueSms, CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const smsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

interface SmsPayload {
    recipientMsisdn: string;
    message: string;
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
            return c.json({ error: "Le message ne doit pas depasser 1600 caracteres" }, 400);
        }

        // ── Vérification du consentement SMS (Loi 2010/012 Art.6 — RGPD-like) ──
        // Si le numéro correspond à un utilisateur KBouffe, il doit avoir
        // explicitement activé les notifications SMS.
        const normalizedPhone = normalizeToE164(body.recipientMsisdn.trim());
        const supabase = createClient(
            c.env.SUPABASE_URL,
            c.env.SUPABASE_SERVICE_ROLE_KEY ?? c.env.SUPABASE_ANON_KEY,
        );

        const { data: user } = await supabase
            .from("users")
            .select("id, sms_notifications_enabled")
            .eq("phone", normalizedPhone)
            .maybeSingle();

        if (user && user.sms_notifications_enabled === false) {
            return c.json(
                { error: "Cet utilisateur a désactivé les notifications SMS. Le message ne peut pas être envoyé." },
                403,
            );
        }

        // Queue SMS since we now use the worker's internal queuing system
        await enqueueSms(c.env, {
            to: normalizedPhone,
            content: body.message.trim(),
        });

        return c.json({
            success: true,
            queued: true,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur envoi SMS";
        console.error("POST /sms/send error:", error);
        return c.json({ error: message }, 502);
    }
});
