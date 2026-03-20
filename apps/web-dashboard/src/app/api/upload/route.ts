import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const SUPABASE_BUCKET = "restaurant-images";

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
        const key = `restaurants/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        console.log("[Upload API] Clé préparée:", key);

        // 5. Upload vers Supabase Storage
        console.log("[Upload API] Upload vers Supabase Storage...");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(key, buffer, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("[Upload API] Erreur Supabase Storage:", error);
            throw new Error(`Erreur upload: ${error.message}`);
        }

        console.log("[Upload API] Upload réussi:", data);

        // URL publique du bucket Supabase
        const { data: publicData } = supabase.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(key);

        const publicUrl = publicData?.publicUrl;

        console.log("[Upload API] Succès:", { url: publicUrl });
        return NextResponse.json({
            success: true,
            url: publicUrl,
            key: key
        });

    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[Upload API] Erreur complète:", errorMsg, err);
        return NextResponse.json({
            error: `Erreur lors de l'upload: ${errorMsg}`
        }, { status: 500 });
    }
}
