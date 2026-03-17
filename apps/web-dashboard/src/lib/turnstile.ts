const VERIFY_URL =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResult {
    success: boolean;
    "error-codes"?: string[];
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.warn(
            "TURNSTILE_SECRET_KEY non configurée — vérification ignorée"
        );
        return true; // Permissif en dev
    }

    const res = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            secret: secretKey,
            response: token,
        }),
    });

    const data: TurnstileVerifyResult = await res.json();
    return data.success;
}
