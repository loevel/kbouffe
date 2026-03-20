import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/chat/orders/[orderId]/upload
 * Upload an image for chat
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate MIME type
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    error: "Unsupported file type (JPG, PNG, WEBP, PDF only)",
                },
                { status: 400 }
            );
        }

        try {
            // Verify user has access to this order
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .select("customer_id, restaurant_id")
                .eq("id", params.orderId)
                .single();

            if (orderError || !order) {
                return NextResponse.json(
                    { error: "Order not found" },
                    { status: 404 }
                );
            }

            const isCustomer = user.id === order.customer_id;
            let isMerchant = false;

            if (!isCustomer) {
                const { data: restaurant } = await supabase
                    .from("restaurants")
                    .select("owner_id")
                    .eq("id", order.restaurant_id)
                    .single();

                isMerchant = restaurant && restaurant.owner_id === user.id;
            }

            if (!isCustomer && !isMerchant) {
                return NextResponse.json(
                    { error: "Not authorized" },
                    { status: 403 }
                );
            }

            // Upload to R2 via Supabase Storage (or direct R2 if configured)
            const fileName = `${crypto.randomUUID()}-${file.name}`;
            const filePath = `chat/orders/${params.orderId}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("images")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                console.error("[Chat Upload] Storage error:", uploadError);
                throw uploadError;
            }

            // Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from("images").getPublicUrl(filePath);

            return NextResponse.json({ url: publicUrl });
        } catch (err) {
            console.error("[Chat Upload] Error uploading file:", err);
            return NextResponse.json(
                { error: "Failed to upload file" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("[Chat Upload] Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
