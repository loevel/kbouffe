import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/security/2fa — Returns current 2FA enrollment status */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        const totpFactor = data?.totp?.find(f => f.status === "verified");
        return NextResponse.json({
            enabled: !!totpFactor,
            factorId: totpFactor?.id ?? null,
        });
    } catch (err) {
        console.error("GET /api/security/2fa error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/** DELETE /api/security/2fa — Unenroll a TOTP factor */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

        const { factorId } = (await request.json()) as { factorId?: string };
        if (!factorId) return NextResponse.json({ error: "factorId requis" }, { status: 400 });

        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/security/2fa error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
