/**
 * SMS route
 * POST /sms/send
 */
import { Hono } from "hono";
import { enqueueSms, CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const smsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

interface SmsPayload {
    recipientMsisdn: string;
    message: string;
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

        // Queue SMS since we now use the worker's internal queuing system
        await enqueueSms(c.env, {
            to: body.recipientMsisdn.trim(),
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
