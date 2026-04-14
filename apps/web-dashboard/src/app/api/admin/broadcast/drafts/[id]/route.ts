/**
 * DELETE /api/admin/broadcast/drafts/[id] — Delete a draft broadcast
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";

function serviceDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { userId } = auth.ctx;

    const db = serviceDb() as any;
    const draftId = params.id;

    try {
        const { error } = await db
            .from("admin_broadcast_drafts")
            .delete()
            .eq("id", draftId)
            .eq("created_by", userId);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Brouillon supprimé",
        });
    } catch (err: any) {
        console.error("[DELETE /api/admin/broadcast/drafts/[id]]", err?.message);
        return apiError("Erreur lors de la suppression du brouillon");
    }
}
