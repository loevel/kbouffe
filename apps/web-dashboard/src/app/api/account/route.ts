import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 1) Delete from public.users table in Supabase
    // (RLS might allow this, but for account deletion we might want to be explicit)
    const { error: deleteProfileError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);

    if (deleteProfileError) {
        console.error("Erreur suppression profil Supabase:", deleteProfileError);
        // We continue anyway to try to delete the auth user
    }

    // 2) Delete from Supabase Auth (admin required for deleting another user or self via admin)
    const admin = await createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
        return NextResponse.json(
            { error: deleteError.message || "Suppression du compte impossible" },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/account error:", error);
    return NextResponse.json(
        { error: "Erreur lors de la suppression du compte" },
        { status: 500 }
    );
  }
}
