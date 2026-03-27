import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type NotificationChannel = {
  email: boolean;
  push: boolean;
};

type PreferencesPayload = {
  settings?: Record<string, NotificationChannel>;
  soundEnabled?: boolean;
};

function isValidSettings(
  value: unknown
): value is Record<string, NotificationChannel> {
  if (!value || typeof value !== "object") return false;

  return Object.values(value).every(
    (channel) =>
      channel &&
      typeof channel === "object" &&
      typeof (channel as NotificationChannel).email === "boolean" &&
      typeof (channel as NotificationChannel).push === "boolean"
  );
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

    const body = (await request.json()) as PreferencesPayload;

    if (
      body.soundEnabled !== undefined &&
      typeof body.soundEnabled !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Champ soundEnabled invalide" },
        { status: 400 }
      );
    }

    if (body.settings !== undefined && !isValidSettings(body.settings)) {
      return NextResponse.json(
        { error: "Format settings invalide" },
        { status: 400 }
      );
    }

    const settings = body.settings ?? {};

    const notificationsEnabled = Object.values(settings).some(
      (channel) => channel.email || channel.push
    );

    const { error: updateError } = await supabase
      .from("users")
      .update({
        notifications_enabled: notificationsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
        console.error("Erreur update Supabase notifications preferences:", updateError);
        return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        settings,
        soundEnabled: body.soundEnabled ?? true,
        notificationsEnabled,
      },
    });
  } catch (error) {
    console.error("POST /api/notifications/preferences error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde des préférences" },
      { status: 500 }
    );
  }
}

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

    const { data: dbUser, error: fetchError } = await supabase
        .from("users")
        .select("notifications_enabled")
        .eq("id", user.id)
        .single();

    if (fetchError) {
        console.error("Erreur fetch Supabase notifications preferences:", fetchError);
        return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    const notificationsEnabled = dbUser?.notifications_enabled ?? true;

    return NextResponse.json({
      preferences: {
        notificationsEnabled,
      },
    });
  } catch (error) {
    console.error("GET /api/notifications/preferences error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des préférences" },
      { status: 500 }
    );
  }
}
