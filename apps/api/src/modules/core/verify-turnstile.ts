/**
 * Turnstile verification route
 * POST /verify-turnstile
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const verifyTurnstileRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResult {
    success: boolean;
    "error-codes"?: string[];
}

verifyTurnstileRoutes.post("/", async (c) => {
    const { token } = await c.req.json();

    if (!token) {
        return c.json({ success: false }, 400);
    }

    const secretKey = c.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.warn("TURNSTILE_SECRET_KEY non configurée — vérification ignorée");
        return c.json({ success: true });
    }

    try {
        const res = await fetch(VERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                secret: secretKey,
                response: token,
            }),
        });

        const data = await res.json() as TurnstileVerifyResult;
        return c.json({ success: data.success });
    } catch (e) {
        console.error("Turnstile verification failed:", e);
        return c.json({ success: false }, 500);
    }
});
