import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const sessions = [
      {
        id: "current",
        device: "Session actuelle",
        location: "Inconnue",
        lastActive: "Maintenant",
        current: true,
      },
    ];

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/security/sessions error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
    };

    if (body.action !== "revoke_all") {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Impossible de déconnecter toutes les sessions" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/security/sessions error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la révocation des sessions" },
      { status: 500 }
    );
  }
}
