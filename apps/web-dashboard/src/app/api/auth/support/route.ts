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

        const { data: tickets, error: fetchError } = await supabase
            .from("support_tickets")
            .select("*")
            .eq("reporter_id", user.id)
            .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        return NextResponse.json(tickets || []);
    } catch (error) {
        console.error("Erreur API fetch support tickets:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la récupération des tickets" },
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

        const body = await request.json();
        const { subject, description, priority, order_id, restaurant_id } = body;

        if (!subject || !description) {
            return NextResponse.json({ error: "Sujet et description sont requis" }, { status: 400 });
        }

        const { data: newTicket, error: insertError } = await supabase
            .from("support_tickets")
            .insert({
                reporter_id: user.id,
                reporter_type: "customer",
                subject,
                description,
                priority: priority || "medium",
                status: "open",
                order_id: order_id || null,
                restaurant_id: restaurant_id || null,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json(newTicket);
    } catch (error) {
        console.error("Erreur API create support ticket:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la création du ticket" },
            { status: 500 }
        );
    }
}
