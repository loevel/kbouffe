import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: NextRequest) {
    // 1. Authentification
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 2. Récupération du fichier
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // 3. Validations
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
    }

    // 4. Préparation de l'upload
    const ext = file.name.split(".").pop() || "jpg";
    const key = `dishes/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    try {
        // Accès aux bindings Cloudflare via OpenNext
        const { env } = getCloudflareContext();
        const bucket = env.IMAGES_BUCKET as R2Bucket;

        if (!bucket) {
            throw new Error("Binding IMAGES_BUCKET non trouvé");
        }

        await bucket.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
            customMetadata: {
                uploadedBy: user.id,
            }
        });

        // URL publique du bucket R2
        const publicUrl = `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL ?? "https://kbouffe-images.d58014fa11833876c245e4828ab1cc8a.r2.cloudflarecontent.com"}/${key}`;

        return NextResponse.json({ 
            success: true, 
            url: publicUrl, 
            key: key 
        });

    } catch (err) {
        console.error("R2 Upload Error:", err);
        return NextResponse.json({ 
            error: "Erreur lors de l'upload vers le stockage" 
        }, { status: 500 });
    }
}
