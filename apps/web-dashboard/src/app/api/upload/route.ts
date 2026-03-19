import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: NextRequest) {
    try {
        console.log("[Upload API] Requête reçue");

        // 1. Authentification
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error("[Upload API] Authentification échouée");
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }
        console.log("[Upload API] Utilisateur authentifié:", user.id);

        // 2. Récupération du fichier
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            console.error("[Upload API] Aucun fichier fourni");
            return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
        }
        console.log("[Upload API] Fichier reçu:", { name: file.name, size: file.size, type: file.type });

        // 3. Validations
        if (!ALLOWED_TYPES.includes(file.type)) {
            console.error("[Upload API] Type non autorisé:", file.type);
            return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            console.error("[Upload API] Fichier trop volumineux:", file.size);
            return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
        }

        // 4. Préparation de l'upload
        const ext = file.name.split(".").pop() || "jpg";
        const key = `dishes/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        console.log("[Upload API] Clé préparée:", key);

        try {
            // Accès aux bindings Cloudflare via OpenNext
            const { env } = getCloudflareContext();
            const bucket = env.IMAGES_BUCKET as R2Bucket;

            if (!bucket) {
                console.error("[Upload API] IMAGES_BUCKET binding non trouvé");
                throw new Error("Binding IMAGES_BUCKET non trouvé");
            }

            console.log("[Upload API] Début de l'upload R2...");
            await bucket.put(key, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                },
                customMetadata: {
                    uploadedBy: user.id,
                }
            });
            console.log("[Upload API] Upload R2 réussi");

            // URL publique du bucket R2
            const publicUrl = `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL ?? "https://kbouffe-images.d58014fa11833876c245e4828ab1cc8a.r2.cloudflarecontent.com"}/${key}`;

            console.log("[Upload API] Succès:", { url: publicUrl });
            return NextResponse.json({
                success: true,
                url: publicUrl,
                key: key
            });

        } catch (r2Error) {
            console.error("[Upload API] Erreur R2:", r2Error instanceof Error ? r2Error.message : String(r2Error));
            throw r2Error;
        }

    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[Upload API] Erreur complète:", errorMsg, err);
        return NextResponse.json({
            error: `Erreur lors de l'upload: ${errorMsg}`
        }, { status: 500 });
    }
}
