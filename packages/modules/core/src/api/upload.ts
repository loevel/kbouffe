import { Hono } from "hono";
import type { CoreEnv, CoreVariables } from "./types";

export const uploadRoutes = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

// SEC-009: Magic bytes signatures for each allowed MIME type
const MAGIC_BYTES: Record<string, number[][]> = {
    "image/jpeg": [[0xFF, 0xD8, 0xFF]],
    "image/png":  [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF....WEBP
    "image/avif": [[0x00, 0x00, 0x00]], // ftyp box — relaxed check, validated by ext
};

function verifyMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
    const signatures = MAGIC_BYTES[mimeType];
    if (!signatures) return false;
    return signatures.some(sig => sig.every((byte, i) => bytes[i] === byte));
}

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

    // SEC-009: Validate file extension against whitelist
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return c.json({ error: "Extension de fichier non autorisée" }, 400);
    }

    if (file.size > MAX_SIZE) {
        return c.json({ error: "Fichier trop volumineux (max 5 Mo)" }, 400);
    }

    const bucket = c.env.IMAGES_BUCKET;
    if (!bucket) return c.json({ error: "Bucket non configuré" }, 500);

    // Feature 28: Deduplication via content hash
    const arrayBuffer = await file.arrayBuffer();

    // SEC-009: Verify magic bytes — ensures Content-Type matches actual file content
    const header = new Uint8Array(arrayBuffer.slice(0, 12));
    if (!verifyMagicBytes(header, file.type)) {
        return c.json({ error: "Contenu du fichier invalide ou corrompu" }, 400);
    }
    // Reject SVG/HTML disguised as images
    const textSample = new TextDecoder("utf-8", { fatal: false }).decode(header);
    if (/<[!?]|<svg|<html|<script/i.test(textSample)) {
        return c.json({ error: "Contenu du fichier non autorisé" }, 400);
    }

    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
    const safeExt = ext === "jpg" ? "jpeg" : ext;
    const hashedKey = `assets/${hashHex}.${safeExt}`;

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
