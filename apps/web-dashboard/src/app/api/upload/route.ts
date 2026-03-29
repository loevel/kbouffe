import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// ── R2 types ────────────────────────────────────────────────────────────────

interface R2Bucket {
  put(
    key: string,
    value: ReadableStream<Uint8Array> | ArrayBuffer | string,
    options?: { httpMetadata?: { contentType: string }; customMetadata?: Record<string, string> }
  ): Promise<unknown>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const R2_PUBLIC_URL = "https://pub-1729b536b57c42c9a54d530432764964.r2.dev";

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // 1. Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 2. Fichier
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
        }

        // 3. Validations
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: "Type non autorisé (jpeg, png, webp, avif)" }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "Fichier trop volumineux (max 8 Mo)" }, { status: 400 });
        }

        // 4. Clé de fichier
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const folder = (formData.get("folder") as string | null) || "dishes";
        const key = `${folder}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();

        // 5a. Tentative upload R2 (production Cloudflare Workers)
        const r2Bucket = (request as any).env?.IMAGES_BUCKET as R2Bucket | undefined;
        if (r2Bucket) {
            await r2Bucket.put(key, arrayBuffer, {
                httpMetadata: { contentType: file.type },
                customMetadata: { uploadedBy: user.id },
            });
            const publicUrl = `${R2_PUBLIC_URL}/${key}`;
            return NextResponse.json({ success: true, url: publicUrl, key, storage: "r2" });
        }

        // 5b. Fallback Supabase Storage (dev local / environnements sans R2)
        console.warn("[Upload API] R2 indisponible — fallback Supabase Storage");
        const { data, error: sbError } = await supabase.storage
            .from("images")
            .upload(key, arrayBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (sbError) {
            console.error("[Upload API] Supabase Storage error:", sbError);
            throw new Error(sbError.message);
        }

        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(data.path);
        return NextResponse.json({ success: true, url: publicUrl, key: data.path, storage: "supabase" });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Upload API] Erreur:", msg);
        return NextResponse.json({ error: `Erreur lors de l'upload : ${msg}` }, { status: 500 });
    }
}
