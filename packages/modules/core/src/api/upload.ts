import { Hono } from "hono";
import type { CoreEnv, CoreVariables } from "./types";

export const uploadRoutes = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

uploadRoutes.post("/", async (c) => {
    const fingerprint = c.req.header("x-file-fingerprint");
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return c.json({ error: "Aucun fichier" }, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return c.json({ error: "Type non autorisé" }, 400);
    }

    if (file.size > MAX_SIZE) {
        return c.json({ error: "Fichier trop volumineux (max 5 Mo)" }, 400);
    }

    const bucket = c.env.IMAGES_BUCKET;
    if (!bucket) return c.json({ error: "Bucket non configuré" }, 500);

    // Feature 28: Deduplication via content hash
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
    const ext = file.name.split(".").pop() || "jpg";
    const hashedKey = `assets/${hashHex}.${ext}`;

    await bucket.put(hashedKey, arrayBuffer, {
        httpMetadata: {
            contentType: file.type,
        },
        customMetadata: {
            uploadedBy: c.var.userId || "anonymous",
            originalName: file.name,
            ...(fingerprint ? { fingerprint } : {}),
        },
    });

    const publicUrl = `https://pub-1729b536b57c42c9a54d530432764964.r2.dev/${hashedKey}`;

    return c.json({ url: publicUrl, key: hashedKey });
});
