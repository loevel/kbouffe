import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 *
 * Gère les redirections Supabase après :
 *  - Réinitialisation de mot de passe (type=recovery)
 *  - Confirmation d'email (type=signup)
 *  - Magic link (type=magiclink)
 *
 * Supabase redirige vers cette route avec :
 *  - token_hash  : le jeton OTP à échanger
 *  - type        : recovery | signup | magiclink
 *  - next        : (optionnel) route cible après échange
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);

    const token_hash = searchParams.get("token_hash");
    const type       = searchParams.get("type") as "recovery" | "signup" | "magiclink" | null;
    const next       = searchParams.get("next") ?? "/";
    const code       = searchParams.get("code"); // PKCE flow fallback

    const supabase = await createClient();

    // ── PKCE code flow (signup confirmation, OAuth) ──
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Lien invalide ou expiré.")}`
        );
    }

    // ── OTP token_hash flow (recovery, magic link) ──
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (!error) {
            // Pour la récupération de mot de passe, on redirige toujours vers /reset-password
            const destination = type === "recovery" ? "/reset-password" : next;
            return NextResponse.redirect(`${origin}${destination}`);
        }
        // Token expiré ou déjà utilisé
        return NextResponse.redirect(
            `${origin}/forgot-password?error=${encodeURIComponent(
                type === "recovery"
                    ? "Ce lien est expiré ou déjà utilisé. Faites une nouvelle demande."
                    : "Lien de confirmation invalide ou expiré."
            )}`
        );
    }

    // Fallback
    return NextResponse.redirect(`${origin}/login`);
}
