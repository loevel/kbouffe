/**
 * POST /api/social/publish
 * Publishes content to a social platform or schedules it.
 * Body: { platform, content, image_url?, product_id?, scheduled_at? }
 * Returns: { post: SocialPost }
 *
 * For now, actual publishing to platforms is handled via:
 * - Facebook/Instagram: Graph API (requires user access token)
 * - TikTok: Content Posting API (requires auth)
 * - Telegram: Bot API (requires bot token + chat_id)
 * - WhatsApp: Cloud API (requires access token)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

// ─── Telegram Bot Publish ──────────────────────────────────────────────────
async function publishToTelegram(chatId: string, botToken: string, content: string, imageUrl?: string) {
    const baseUrl = `https://api.telegram.org/bot${botToken}`;

    if (imageUrl && !imageUrl.startsWith("data:")) {
        // Send photo with caption
        const res = await fetch(`${baseUrl}/sendPhoto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                photo: imageUrl,
                caption: content.slice(0, 1024),
                parse_mode: "HTML",
            }),
        });
        return res.json();
    }

    // Text only
    const res = await fetch(`${baseUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text: content,
            parse_mode: "HTML",
        }),
    });
    return res.json();
}

// ─── Facebook Page Publish ─────────────────────────────────────────────────
async function publishToFacebook(pageId: string, accessToken: string, content: string, imageUrl?: string) {
    const baseUrl = `https://graph.facebook.com/v19.0/${pageId}`;

    if (imageUrl && !imageUrl.startsWith("data:")) {
        const res = await fetch(`${baseUrl}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: imageUrl,
                message: content,
                access_token: accessToken,
            }),
        });
        return res.json();
    }

    const res = await fetch(`${baseUrl}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: content,
            access_token: accessToken,
        }),
    });
    return res.json();
}

// ─── Instagram Publish (via Facebook Graph API) ────────────────────────────
async function publishToInstagram(pageId: string, accessToken: string, content: string, imageUrl?: string) {
    if (!imageUrl || imageUrl.startsWith("data:")) {
        return { error: "Instagram requiert une image URL publique" };
    }

    const baseUrl = `https://graph.facebook.com/v19.0/${pageId}`;

    // Step 1: Create media container
    const createRes = await fetch(`${baseUrl}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            image_url: imageUrl,
            caption: content,
            access_token: accessToken,
        }),
    });
    const container = await createRes.json();

    if (!container.id) {
        return { error: "Impossible de creer le media Instagram", details: container };
    }

    // Step 2: Publish
    const publishRes = await fetch(`${baseUrl}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            creation_id: container.id,
            access_token: accessToken,
        }),
    });
    return publishRes.json();
}

export async function POST(request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    const db = supabase as any;
    try {
        const body = await request.json();
        const { platform, content, image_url, product_id, scheduled_at } = body;

        if (!platform || !content?.trim()) {
            return apiError("Plateforme et contenu requis", 400);
        }

        const validPlatforms = ["facebook", "instagram", "tiktok", "telegram", "whatsapp"];
        if (!validPlatforms.includes(platform)) {
            return apiError("Plateforme invalide", 400);
        }

        // Check if scheduling
        if (scheduled_at) {
            const scheduledDate = new Date(scheduled_at);
            if (scheduledDate <= new Date()) {
                return apiError("La date de programmation doit etre dans le futur", 400);
            }

            // Save as scheduled post
            const { data, error } = await db
                .from("social_posts")
                .insert({
                    restaurant_id: restaurantId,
                    platform,
                    content: content.trim(),
                    image_url: image_url || null,
                    product_id: product_id || null,
                    status: "scheduled",
                    scheduled_at: scheduledDate.toISOString(),
                } as any)
                .select()
                .single();

            if (error) {
                console.error("[social/publish] Schedule error:", error);
                return apiError("Erreur lors de la programmation");
            }

            return NextResponse.json({ post: data, message: "Publication programmee" }, { status: 201 });
        }

        // Fetch the social account for this platform
        const { data: account } = await db
            .from("social_accounts")
            .select("*")
            .eq("restaurant_id", restaurantId)
            .eq("platform", platform)
            .eq("is_connected", true)
            .single();

        if (!account) {
            // Save as draft if no connected account
            const { data: draft } = await db
                .from("social_posts")
                .insert({
                    restaurant_id: restaurantId,
                    platform,
                    content: content.trim(),
                    image_url: image_url || null,
                    product_id: product_id || null,
                    status: "draft",
                    error_message: "Compte non connecte — sauvegarde en brouillon",
                } as any)
                .select()
                .single();

            return NextResponse.json({
                post: draft,
                message: `Compte ${platform} non connecte. Post sauvegarde en brouillon.`,
                requiresConnection: true,
            }, { status: 200 });
        }

        // Mark post as publishing
        const { data: post, error: insertErr } = await db
            .from("social_posts")
            .insert({
                restaurant_id: restaurantId,
                platform,
                content: content.trim(),
                image_url: image_url || null,
                product_id: product_id || null,
                status: "publishing",
            } as any)
            .select()
            .single();

        if (insertErr || !post) {
            return apiError("Erreur lors de la creation du post");
        }

        // Attempt to publish
        let publishResult: any = null;
        let publishError: string | null = null;

        try {
            switch (platform) {
                case "telegram":
                    if (account.chat_id && account.access_token) {
                        publishResult = await publishToTelegram(
                            account.chat_id,
                            account.access_token,
                            content.trim(),
                            image_url
                        );
                        if (!publishResult.ok) {
                            publishError = publishResult.description || "Erreur Telegram";
                        }
                    } else {
                        publishError = "Chat ID ou Bot Token manquant";
                    }
                    break;

                case "facebook":
                    if (account.page_id && account.access_token) {
                        publishResult = await publishToFacebook(
                            account.page_id,
                            account.access_token,
                            content.trim(),
                            image_url
                        );
                        if (publishResult.error) {
                            publishError = publishResult.error.message || "Erreur Facebook";
                        }
                    } else {
                        publishError = "Page ID ou Access Token manquant";
                    }
                    break;

                case "instagram":
                    if (account.page_id && account.access_token) {
                        publishResult = await publishToInstagram(
                            account.page_id,
                            account.access_token,
                            content.trim(),
                            image_url
                        );
                        if (publishResult.error) {
                            publishError = typeof publishResult.error === "string"
                                ? publishResult.error
                                : publishResult.error.message || "Erreur Instagram";
                        }
                    } else {
                        publishError = "Page ID ou Access Token manquant";
                    }
                    break;

                case "tiktok":
                case "whatsapp": {
                    // Manual-only platforms — save as draft with no error
                    await db.from("social_posts").update({ status: "draft", error_message: null, updated_at: new Date().toISOString() } as any).eq("id", (post as any).id);
                    return NextResponse.json({
                        post: { ...(post as any), status: "draft" },
                        message: `Contenu sauvegarde en brouillon. Copiez-le pour poster manuellement sur ${platform}.`,
                        success: true,
                    });
                }
            }
        } catch (err) {
            publishError = `Erreur de publication: ${err instanceof Error ? err.message : String(err)}`;
        }

        // Update post status
        const finalStatus = publishError ? "failed" : "published";
        await db
            .from("social_posts")
            .update({
                status: finalStatus,
                published_at: publishError ? null : new Date().toISOString(),
                error_message: publishError,
                external_id: publishResult?.id || publishResult?.result?.message_id || null,
                metadata: publishResult ? JSON.stringify(publishResult) : "{}",
                updated_at: new Date().toISOString(),
            } as any)
            .eq("id", (post as any).id);

        return NextResponse.json({
            post: { ...(post as any), status: finalStatus, error_message: publishError },
            message: publishError
                ? `Echec: ${publishError}`
                : `Publie sur ${platform} avec succes !`,
            success: !publishError,
        });
    } catch (err) {
        console.error("[social/publish] Unexpected:", err);
        return apiError("Erreur serveur");
    }
}

// ─── GET: list posts ───────────────────────────────────────────────────────
export async function GET() {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;
    const db = supabase as any;

    const { data, error } = await db
        .from("social_posts")
        .select("id, platform, content, image_url, status, scheduled_at, published_at, error_message, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("[GET /api/social/publish]", error);
        return apiError("Erreur lors du chargement des posts");
    }

    return NextResponse.json({ posts: data ?? [] });
}
