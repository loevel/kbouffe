import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "edge";

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ 
                success: false, 
                error: "Token manquant" 
            }, { status: 400 });
        }

        const success = await verifyTurnstileToken(token);

        if (!success) {
            return NextResponse.json({ 
                success: false, 
                error: "Échec de la vérification du captcha" 
            }, { status: 403 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Turnstile verification error:", err);
        return NextResponse.json({ 
            success: false, 
            error: "Erreur serveur lors de la vérification" 
        }, { status: 500 });
    }
}
