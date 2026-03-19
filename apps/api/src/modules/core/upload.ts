/**
 * Upload route
 * POST /upload
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const uploadRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

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

    const ext = file.name.split(".").pop() || "jpg";
    const key = `dishes/${c.var.userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const bucket = c.env.IMAGES_BUCKET;

    await bucket.put(key, await file.arrayBuffer(), {
        httpMetadata: {
            contentType: file.type,
        },
        customMetadata: {
            uploadedBy: c.var.userId,
            ...(fingerprint ? { fingerprint } : {}),
        },
    });

    // Public URL logic. Uses R2 bucket public domain
    const publicUrl = `https://pub-1729b536b57c42c9a54d530432764964.r2.dev/${key}`;

    return c.json({ url: publicUrl, key });
});
