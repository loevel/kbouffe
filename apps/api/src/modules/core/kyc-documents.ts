/**
 * POST /restaurant/kyc/documents/:type
 *   type ∈ { niu, rccm, id }
 *
 * Uploads a KYC document to the PRIVATE R2 bucket and stores the bucket key
 * in the corresponding restaurants.kyc_*_url column. The stored value is an
 * object key (not a public URL), so only the authenticated admin proxy can
 * retrieve it.
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const kycDocumentsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);

const MAGIC_BYTES: Record<string, number[][]> = {
    "image/jpeg": [[0xFF, 0xD8, 0xFF]],
    "image/png":  [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    "image/webp": [[0x52, 0x49, 0x46, 0x46]],
    "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
};

function verifyMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
    const signatures = MAGIC_BYTES[mimeType];
    if (!signatures) return false;
    return signatures.some(sig => sig.every((byte, i) => bytes[i] === byte));
}

const FIELD_MAP: Record<string, string> = {
    niu: "kyc_niu_url",
    rccm: "kyc_rccm_url",
    id: "kyc_id_url",
};

kycDocumentsRoutes.post("/:type", async (c) => {
    const type = c.req.param("type");
    const field = FIELD_MAP[type];
    if (!field) return c.json({ error: "Type de document invalide" }, 400);

    const bucket = c.env.PRIVATE_BUCKET;
    if (!bucket) return c.json({ error: "Stockage privé non configuré" }, 500);

    const restaurantId = c.var.restaurantId;
    if (!restaurantId) return c.json({ error: "Restaurant introuvable" }, 403);

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ error: "Aucun fichier fourni" }, 400);

    if (!ALLOWED_TYPES.includes(file.type)) {
        return c.json({ error: "Type non autorisé (JPG, PNG, WEBP, PDF uniquement)" }, 400);
    }
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return c.json({ error: "Extension de fichier non autorisée" }, 400);
    }
    if (file.size > MAX_SIZE) {
        return c.json({ error: "Fichier trop volumineux (max 8 Mo)" }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const header = new Uint8Array(arrayBuffer.slice(0, 12));
    if (!verifyMagicBytes(header, file.type)) {
        return c.json({ error: "Contenu du fichier invalide ou corrompu" }, 400);
    }
    const textSample = new TextDecoder("utf-8", { fatal: false }).decode(header);
    if (/<svg|<html|<script/i.test(textSample)) {
        return c.json({ error: "Contenu du fichier non autorisé" }, 400);
    }

    const safeExt = ext === "jpg" ? "jpeg" : ext;
    const key = `kyc/${restaurantId}/${type}-${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

    await bucket.put(key, arrayBuffer, {
        httpMetadata: { contentType: file.type },
        customMetadata: {
            restaurantId,
            uploadedBy: c.var.userId,
            documentType: type,
        },
    });

    const { error } = await c.var.supabase
        .from("restaurants")
        .update({ [field]: key } as never)
        .eq("id", restaurantId);

    if (error) {
        await bucket.delete(key).catch(() => {});
        return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, key });
});
