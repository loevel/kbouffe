/**
 * FCM HTTP v1 — Deno Edge Function compatible.
 * Port of src/lib/firebase/admin.ts for Supabase Edge Functions.
 */

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

async function getAccessToken(): Promise<string> {
  const projectId = Deno.env.get("FIREBASE_ADMIN_PROJECT_ID");
  const clientEmail = Deno.env.get("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = Deno.env.get("FIREBASE_ADMIN_PRIVATE_KEY")?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin env vars missing");
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
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const signingInput = `${encode(header)}.${encode(payload)}`;

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
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signingInput}.${signatureB64}`;

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
    throw new Error(`FCM access token error: ${err}`);
  }

  const { access_token } = (await tokenRes.json()) as {
    access_token: string;
  };
  return access_token;
}

export async function sendFcmMessage(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  link?: string,
): Promise<boolean> {
  const projectId = Deno.env.get("FIREBASE_ADMIN_PROJECT_ID");
  if (!projectId) return false;

  try {
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
            token,
            notification: { title, body },
            data: data ?? {},
            webpush: {
              fcm_options: { link: link ?? "/" },
              notification: { title, body, icon: "/logo-icon.svg" },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      if (res.status === 404 || res.status === 400) return false;
      console.error(`FCM error ${res.status}: ${await res.text()}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[FCM]", err);
    return false;
  }
}

export async function sendFcmBatch(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
  link?: string,
): Promise<void> {
  await Promise.allSettled(
    tokens.map((token) => sendFcmMessage(token, title, body, data, link)),
  );
}
