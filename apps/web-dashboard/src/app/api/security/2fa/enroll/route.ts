import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/security/2fa/enroll — Start TOTP enrollment, returns QR code */
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

        // Unenroll any existing unverified factor first (clean state)
        const { data: existing } = await supabase.auth.mfa.listFactors();
        const unverified = existing?.totp?.find(f => f.status === "unverified");
        if (unverified) {
            await supabase.auth.mfa.unenroll({ factorId: unverified.id });
        }

        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: "totp",
            issuer: "KBouffe Dashboard",
            friendlyName: user.email ?? user.phone ?? "merchant",
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({
            factorId: data.id,
            qrCode: data.totp.qr_code,
            secret: data.totp.secret,
        });
    } catch (err) {
        console.error("POST /api/security/2fa/enroll error:", err);
        return NextResponse.json({ error: "Erreur lors de l'activation de la 2FA" }, { status: 500 });
    }
}
