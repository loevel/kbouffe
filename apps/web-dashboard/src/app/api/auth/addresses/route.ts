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

        const { data: userAddresses, error: fetchError } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id);

        if (fetchError) throw fetchError;

        return NextResponse.json(userAddresses || []);
    } catch (error) {
        console.error("Erreur API fetch addresses:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la récupération des adresses" },
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
        const { label, address: addressLine, city, postal_code, lat, lng, instructions, is_default } = body;

        if (!addressLine || !city) {
            return NextResponse.json({ error: "Adresse et ville sont requises" }, { status: 400 });
        }

        // If this is set as default, unset others first in Supabase
        if (is_default) {
            await supabase
                .from("addresses")
                .update({ is_default: false })
                .eq("user_id", user.id);
        }

        const { data: newAddress, error: insertError } = await supabase
            .from("addresses")
            .insert({
                user_id: user.id,
                label: label || "Domicile",
                address: addressLine,
                city,
                postal_code: postal_code,
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
                instructions,
                is_default: !!is_default,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json(newAddress);
    } catch (error) {
        console.error("Erreur API create address:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la création de l'adresse" },
            { status: 500 }
        );
    }
}
