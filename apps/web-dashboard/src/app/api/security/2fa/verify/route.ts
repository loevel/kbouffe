import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/security/2fa/verify — Complete TOTP enrollment by verifying code */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

        const { factorId, code } = (await request.json()) as { factorId?: string; code?: string };
        if (!factorId || !code) return NextResponse.json({ error: "factorId et code requis" }, { status: 400 });

        const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
        if (error) return NextResponse.json({ error: "Code incorrect ou expiré" }, { status: 400 });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("POST /api/security/2fa/verify error:", err);
        return NextResponse.json({ error: "Erreur lors de la vérification" }, { status: 500 });
    }
}
