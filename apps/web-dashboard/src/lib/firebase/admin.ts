/**
 * Firebase FCM HTTP v1 — envoi serveur compatible Edge/Cloudflare.
 * N'utilise PAS firebase-admin (incompatible Cloudflare Workers).
 * Génère un JWT depuis le Service Account pour obtenir un access_token OAuth2,
 * puis appelle directement l'API REST FCM v1.
 *
 * Variables d'environnement requises :
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY   (clé PEM, \n réels ou littéraux)
 */

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

/** Génère un access token OAuth2 depuis les credentials du Service Account */
async function getAccessToken(): Promise<string> {
    const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            "Firebase Admin : FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL " +
            "et FIREBASE_ADMIN_PRIVATE_KEY doivent être définis dans .env.local"
        );
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: clientEmail,
        sub: clientEmail,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
        scope: FCM_SCOPE,
    };

    const encode = (obj: object) =>
        btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    const signingInput = `${encode(header)}.${encode(payload)}`;

    // Import de la clé RSA privée via Web Crypto API (disponible en Edge)
    const pemBody = privateKey
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\s/g, "");
    const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        keyData,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        new TextEncoder().encode(signingInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    const jwt = `${signingInput}.${signatureB64}`;

    // Échange du JWT contre un access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!tokenRes.ok) {
        const err = await tokenRes.text();
        throw new Error(`Impossible d'obtenir l'access token FCM : ${err}`);
    }

    const { access_token } = await tokenRes.json() as { access_token: string };
    return access_token;
}

export interface FcmMessage {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    link?: string;
}

/** Envoie une notification push FCM à un seul token */
export async function sendFcmMessage(msg: FcmMessage): Promise<void> {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    if (!projectId) throw new Error("FIREBASE_ADMIN_PROJECT_ID manquant");

    const accessToken = await getAccessToken();

    const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                message: {
                    token: msg.token,
                    notification: { title: msg.title, body: msg.body },
                    data: msg.data ?? {},
                    webpush: {
                        fcm_options: { link: msg.link ?? "/" },
                        notification: {
                            title: msg.title,
                            body: msg.body,
                            icon: "/logo-icon.svg",
                        },
                    },
                },
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        // Token invalide/expiré → on ignore silencieusement
        if (res.status === 404 || res.status === 400) {
            console.warn(`[FCM] Token invalide ignoré pour ${msg.token.slice(0, 20)}...`);
            return;
        }
        throw new Error(`FCM send error ${res.status}: ${err}`);
    }
}

/** Envoie en batch (max 500 tokens) */
export async function sendFcmBatch(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    link?: string
): Promise<void> {
    await Promise.allSettled(
        tokens.map((token) => sendFcmMessage({ token, title, body, data, link }))
    );
}
