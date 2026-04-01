/**
 * Public store routes — customer-facing, no auth required.
 *
 * GET  /store/:slug         — restaurant detail + menu + reviews
 * POST /store/order         — create a guest order
 * GET  /store/orders/:id    — track order by ID
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { publicReservationsRoutes } from "@kbouffe/module-reservations";
import type { Env } from "../../types";

export const storePublicRoutes = new Hono<{ Bindings: Env }>();

storePublicRoutes.route("/", publicReservationsRoutes);

const ALLOWED_DELIVERY_TYPES = ["delivery", "pickup", "dine_in"] as const;
const ALLOWED_PAYMENT_METHODS = ["cash", "mobile_money_mtn", "mobile_money_orange"] as const;

type DeliveryType = (typeof ALLOWED_DELIVERY_TYPES)[number];
type PaymentMethod = (typeof ALLOWED_PAYMENT_METHODS)[number];

// ── Helper: admin Supabase client ─────────────────────────────────
function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

function getMtnBaseUrl(env: Env) {
    return env.MTN_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
}

function isMtnCollectionConfigured(env: Env) {
    return Boolean(
        env.MTN_COLLECTION_API_USER &&
        env.MTN_COLLECTION_API_KEY &&
        env.MTN_COLLECTION_SUBSCRIPTION_KEY,
    );
}

async function getMtnCollectionToken(env: Env): Promise<string> {
    const credentials = btoa(`${env.MTN_COLLECTION_API_USER}:${env.MTN_COLLECTION_API_KEY}`);
    const response = await fetch(`${getMtnBaseUrl(env)}/collection/token/`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY ?? "",
        },
    });

    const payload = await response.json().catch(() => ({} as { access_token?: string; message?: string; error?: string })) as { access_token?: string; message?: string; error?: string };
    if (!response.ok || !payload.access_token) {
        throw new Error(payload.message ?? payload.error ?? `MTN token error: ${response.status}`);
    }
    return payload.access_token;
}

async function requestMtnToPay(
    env: Env,
    params: {
        referenceId: string;
        amount: number;
        externalId: string;
        payerMsisdn: string;
        payerMessage: string;
        payeeNote: string;
    },
) {
    const token = await getMtnCollectionToken(env);
    const response = await fetch(`${getMtnBaseUrl(env)}/collection/v1_0/requesttopay`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "X-Reference-Id": params.referenceId,
            "X-Target-Environment": env.MTN_TARGET_ENVIRONMENT ?? "sandbox",
            "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY ?? "",
            "Content-Type": "application/json",
            ...(env.MTN_COLLECTION_CALLBACK_URL ? { "X-Callback-Url": env.MTN_COLLECTION_CALLBACK_URL } : {}),
        },
        body: JSON.stringify({
            amount: String(params.amount),
            currency: "XAF",
            externalId: params.externalId,
            payer: { partyIdType: "MSISDN", partyId: params.payerMsisdn },
            payerMessage: params.payerMessage,
            payeeNote: params.payeeNote,
        }),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`MTN request-to-pay error: ${response.status}${text ? ` — ${text}` : ""}`);
    }
}

// ── POST /order — create a guest order ────────────────────────────
storePublicRoutes.post("/order", async (c) => {
    try {
        const body = await c.req.json<{
            restaurantId: string;
            customerId?: string;
            items: Array<{
                productId: string;
                name: string;
                price: number;
                quantity: number;
                options?: Array<{
                    optionId?: string;
                    valueId?: string;
                    name: string;
                    value: string;
                    priceAdjustment: number;
                }>;
            }>;
            deliveryType: DeliveryType;
            deliveryAddress?: string;
            tableNumber?: string;
            customerName: string;
            customerPhone: string;
            paymentMethod: PaymentMethod;
            subtotal: number;
            deliveryFee: number;
            total: number;
            notes?: string;
            externalDrinksCount?: number;
            giftCardCode?: string;
        }>();

        // ── Validation ────────────────────────────────────────────
        if (!body.restaurantId) return c.json({ error: "restaurantId requis" }, 400);
        if (!body.items?.length) return c.json({ error: "La commande doit contenir au moins un article" }, 400);
        if (!body.customerName?.trim()) return c.json({ error: "customerName requis" }, 400);
        if (!body.customerPhone?.trim()) return c.json({ error: "customerPhone requis" }, 400);
        if (!ALLOWED_DELIVERY_TYPES.includes(body.deliveryType)) return c.json({ error: "deliveryType invalide" }, 400);
        if (!ALLOWED_PAYMENT_METHODS.includes(body.paymentMethod)) return c.json({ error: "paymentMethod invalide" }, 400);

        const supabase = getAdminClient(c.env);

        // Fetch restaurant settings to compute server-side fees + loyalty
        const { data: restSettings } = await supabase
            .from("restaurants")
            .select("dine_in_service_fee, corkage_fee_amount, min_order_amount, loyalty_enabled, loyalty_points_per_order, loyalty_point_value, delivery_fee, delivery_base_fee")
            .eq("id", body.restaurantId)
            .single();

        const dineInServiceFee = restSettings?.dine_in_service_fee ?? 0;
        const corkageFeeAmount = restSettings?.corkage_fee_amount ?? 0;

        // SEC-002: Validate product prices from DB — never trust client-sent prices
        const productIds = body.items.map(i => i.productId);
        const { data: dbProducts } = await supabase
            .from("products")
            .select("id, price, dine_in_price, is_available")
            .in("id", productIds)
            .eq("restaurant_id", body.restaurantId);

        if (!dbProducts || dbProducts.length !== productIds.length) {
            return c.json({ error: "Un ou plusieurs produits sont invalides ou n'appartiennent pas à ce restaurant" }, 400);
        }

        const productMap = new Map(dbProducts.map(p => [p.id, p as { id: string; price: number; dine_in_price: number | null; is_available: boolean }]));

        // Fetch option values prices from DB for price_adjustment validation
        const allValueIds = body.items.flatMap(i => (i.options ?? []).map(o => o.valueId).filter(Boolean)) as string[];
        const valueAdjustMap = new Map<string, number>();
        if (allValueIds.length > 0) {
            const { data: dbValues } = await supabase
                .from("menu_item_option_values")
                .select("id, price_adjustment")
                .in("id", allValueIds);
            for (const v of dbValues ?? []) {
                valueAdjustMap.set(v.id, (v as any).price_adjustment ?? 0);
            }
        }

        // Compute subtotal server-side from DB prices
        let computedSubtotal = 0;
        for (const item of body.items) {
            const dbProduct = productMap.get(item.productId);
            if (!dbProduct) return c.json({ error: `Produit ${item.productId} introuvable` }, 400);
            if (!dbProduct.is_available) return c.json({ error: `Le produit "${item.name}" n'est plus disponible` }, 400);

            const basePrice = body.deliveryType === "dine_in" && dbProduct.dine_in_price
                ? dbProduct.dine_in_price
                : dbProduct.price;

            let optionsTotal = 0;
            for (const opt of item.options ?? []) {
                if (opt.valueId) optionsTotal += valueAdjustMap.get(opt.valueId) ?? 0;
            }
            computedSubtotal += (basePrice + optionsTotal) * item.quantity;
        }

        if (restSettings?.min_order_amount && computedSubtotal < restSettings.min_order_amount) {
            return c.json({ error: `Montant minimum de commande : ${restSettings.min_order_amount} FCFA` }, 400);
        }

        // SEC-008: Compute server-side fees using validated subtotal + server-side delivery fee
        const serviceFee = body.deliveryType === "dine_in"
            ? Math.round(computedSubtotal * dineInServiceFee / 100)
            : 0;
        const externalDrinksCount = Math.max(0, Number(body.externalDrinksCount ?? 0));
        const corkageFee = externalDrinksCount > 0
            ? corkageFeeAmount * externalDrinksCount
            : 0;
        // Delivery fee: free for dine_in/pickup, otherwise from restaurant config
        const serverDeliveryFee = (body.deliveryType === "dine_in" || body.deliveryType === "pickup")
            ? 0
            : (restSettings?.delivery_fee ?? restSettings?.delivery_base_fee ?? 0);
        const computedTotal = computedSubtotal + serverDeliveryFee + serviceFee + corkageFee;

        // ── Validation carte cadeau (si fournie) ──────────────────────────
        let giftCardId: string | null = null;
        let giftCardAmount = 0;
        let finalTotal = computedTotal;

        if (body.giftCardCode?.trim()) {
            const giftCardCode = body.giftCardCode.trim().toUpperCase();

            const { data: giftCard, error: gcError } = await supabase
                .from("gift_cards")
                .select("id, current_balance, expires_at, is_active")
                .eq("restaurant_id", body.restaurantId)
                .eq("code", giftCardCode)
                .eq("is_active", true)
                .maybeSingle();

            if (gcError) {
                console.error("[POST /store/order] Gift card query error:", gcError);
                return c.json({ error: "Erreur lors de la validation de la carte cadeau" }, 500);
            }

            if (!giftCard) {
                return c.json({ error: "Code carte cadeau invalide ou inactif" }, 400);
            }

            if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
                return c.json({ error: "Cette carte cadeau a expiré" }, 400);
            }

            if (giftCard.current_balance <= 0) {
                return c.json({ error: "Le solde de cette carte cadeau est épuisé" }, 400);
            }

            giftCardId = giftCard.id as string;
            giftCardAmount = Math.min(giftCard.current_balance as number, computedTotal);
            finalTotal = computedTotal - giftCardAmount;
        }

        // 1. Create the Order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                restaurant_id: body.restaurantId,
                customer_id: body.customerId ?? null,
                customer_name: body.customerName.trim(),
                customer_phone: body.customerPhone.trim(),
                items: body.items, // Keep JSON for backward compatibility / quick view
                subtotal: computedSubtotal,
                delivery_fee: serverDeliveryFee,
                service_fee: serviceFee,
                corkage_fee: corkageFee,
                external_drinks_count: externalDrinksCount,
                total: finalTotal,
                gift_card_id: giftCardId,
                gift_card_amount: giftCardAmount,
                loyalty_points_earned: 0,
                status: "pending",
                delivery_type: body.deliveryType,
                delivery_address: body.deliveryAddress ?? null,
                payment_method: body.paymentMethod,
                payment_status: "pending",
                notes: body.notes ?? null,
                table_number: body.tableNumber ?? null,
            } as any)
            .select("id")
            .single();

        if (orderError || !order) {
            console.error("[POST /store/order] Supabase order error:", orderError);
            return c.json({ error: "Erreur lors de la création de la commande" }, 500);
        }

        const orderId = (order as { id: string }).id;

        // 2. Create Order Items and Options
        for (const item of body.items) {
            const dbProduct = productMap.get(item.productId)!;
            const basePrice = body.deliveryType === "dine_in" && dbProduct.dine_in_price
                ? dbProduct.dine_in_price
                : dbProduct.price;
            let optionsTotal = 0;
            for (const opt of item.options ?? []) {
                if (opt.valueId) optionsTotal += valueAdjustMap.get(opt.valueId) ?? 0;
            }
            const validatedItemPrice = basePrice + optionsTotal;

            const { data: orderItem, error: itemError } = await supabase
                .from("order_items")
                .insert({
                    order_id: orderId,
                    product_id: item.productId,
                    name: item.name,
                    price: validatedItemPrice,
                    quantity: item.quantity,
                    subtotal: validatedItemPrice * item.quantity,
                } as any)
                .select("id")
                .single();

            if (itemError || !orderItem) {
                console.error("[POST /store/order] Supabase item error:", itemError);
                // We don't fail the whole request since order is created, but we should log
                continue;
            }

            if (item.options?.length) {
                const optionsToInsert = item.options.map(opt => ({
                    order_item_id: orderItem.id,
                    option_id: opt.optionId ?? null,
                    value_id: opt.valueId ?? null,
                    name: opt.name,
                    value: opt.value,
                    price_adjustment: opt.priceAdjustment
                }));

                const { error: optionsError } = await supabase
                    .from("order_item_options")
                    .insert(optionsToInsert as any);

                if (optionsError) {
                    console.error("[POST /store/order] Supabase options error:", optionsError);
                }
            }
        }

        // 3. Déduire le solde de la carte cadeau et enregistrer le mouvement
        if (giftCardId && giftCardAmount > 0) {
            // Récupérer le solde actuel pour calculer le solde restant
            const { data: gcCurrent } = await supabase
                .from("gift_cards")
                .select("current_balance")
                .eq("id", giftCardId)
                .single();

            const balanceBefore = (gcCurrent?.current_balance as number) ?? giftCardAmount;
            const balanceAfter = balanceBefore - giftCardAmount;

            // Décrémenter le solde
            await supabase
                .from("gift_cards")
                .update({
                    current_balance: balanceAfter,
                    is_active: balanceAfter > 0, // désactiver si épuisée
                    updated_at: new Date().toISOString(),
                } as any)
                .eq("id", giftCardId);

            // Enregistrer le mouvement
            await supabase
                .from("gift_card_movements")
                .insert({
                    id: crypto.randomUUID(),
                    gift_card_id: giftCardId,
                    order_id: orderId,
                    amount: -giftCardAmount,
                    balance_after: balanceAfter,
                    type: "redeem",
                    note: `Commande ${orderId}`,
                    created_at: new Date().toISOString(),
                } as any);
        }

        // 4. Award loyalty points if program is enabled and customer is identified
        let loyaltyPointsEarned = 0;
        if (
            restSettings?.loyalty_enabled &&
            body.customerId &&
            (restSettings?.loyalty_points_per_order ?? 0) > 0
        ) {
            const pointsPerOrder = restSettings.loyalty_points_per_order ?? 10;
            const pointValue = restSettings.loyalty_point_value ?? 1;
            loyaltyPointsEarned = pointsPerOrder;
            const creditAmount = pointsPerOrder * pointValue;

            // Record wallet movement
            const { error: walletErr } = await supabase
                .from("wallet_movements")
                .insert({
                    user_id: body.customerId,
                    type: "credit",
                    amount: creditAmount,
                    reason: "loyalty",
                    description: `${pointsPerOrder} points de fidélité`,
                    order_id: orderId,
                } as any);

            if (!walletErr) {
                // Increment user wallet balance
                await supabase.rpc("increment_wallet_balance", {
                    input_user_id: body.customerId,
                    amount: creditAmount,
                });

                // Update order with earned points
                await supabase
                    .from("orders")
                    .update({ loyalty_points_earned: loyaltyPointsEarned } as any)
                    .eq("id", orderId);
            } else {
                console.error("[POST /store/order] Loyalty wallet error:", walletErr);
            }
        }

        let payment: {
            provider: "mtn_momo";
            referenceId: string;
            status: "pending" | "failed";
            error?: string;
        } | null = null;

        if (body.paymentMethod === "mobile_money_mtn") {
            if (!isMtnCollectionConfigured(c.env)) {
                payment = {
                    provider: "mtn_momo",
                    referenceId: "",
                    status: "failed",
                    error: "Configuration MTN manquante",
                };
            } else {
                const referenceId = crypto.randomUUID();
                const externalId = `order-${orderId}`;
                const payerMsisdn = body.customerPhone.trim();

                const { data: tx, error: txError } = await supabase
                    .from("payment_transactions")
                    .insert({
                        restaurant_id: body.restaurantId,
                        order_id: orderId,
                        provider: "mtn_momo",
                        reference_id: referenceId,
                        external_id: externalId,
                        payer_msisdn: payerMsisdn,
                        amount: computedTotal,
                        currency: "XAF",
                        status: "pending",
                        provider_status: "PENDING",
                    } as any)
                    .select("id")
                    .single();

                if (txError || !tx) {
                    payment = {
                        provider: "mtn_momo",
                        referenceId,
                        status: "failed",
                        error: "Impossible de créer la transaction MTN",
                    };
                } else {
                    try {
                        await requestMtnToPay(c.env, {
                            referenceId,
                            amount: computedTotal,
                            externalId,
                            payerMsisdn,
                            payerMessage: "Paiement commande Kbouffe",
                            payeeNote: `Commande ${orderId}`,
                        });

                        payment = {
                            provider: "mtn_momo",
                            referenceId,
                            status: "pending",
                        };
                    } catch (paymentError) {
                        const errorMessage = paymentError instanceof Error ? paymentError.message : "Erreur paiement MTN";
                        await supabase
                            .from("payment_transactions")
                            .update({
                                status: "failed",
                                provider_status: "FAILED",
                                failed_reason: errorMessage,
                                provider_response: { error: errorMessage },
                                updated_at: new Date().toISOString(),
                            } as any)
                            .eq("id", tx.id);

                        await supabase
                            .from("orders")
                            .update({ payment_status: "failed", updated_at: new Date().toISOString() } as any)
                            .eq("id", orderId);

                        payment = {
                            provider: "mtn_momo",
                            referenceId,
                            status: "failed",
                            error: errorMessage,
                        };
                    }
                }
            }
        }

        return c.json({ success: true, orderId, serviceFee, corkageFee, total: finalTotal, giftCardAmount, loyaltyPointsEarned, payment }, 201);
    } catch (error) {
        console.error("[POST /store/order] Unexpected error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── GET /orders/:id — track order by UUID ─────────────────────────
storePublicRoutes.get("/orders/:id", async (c) => {
    try {
        const id = c.req.param("id");
        if (!id || id.length < 10) return c.json({ error: "ID de commande invalide" }, 400);

        const supabase = getAdminClient(c.env);

        const { data: order, error } = await supabase
            .from("orders")
            .select(
                "id, status, payment_status, delivery_type, delivery_address, customer_name, customer_phone, items, subtotal, delivery_fee, service_fee, total, created_at, updated_at, notes, table_number, restaurant_id, preparation_time_minutes, scheduled_for, delivered_at, delivery_note",
            )
            .eq("id", id)
            .single();

        if (error || !order) return c.json({ error: "Commande introuvable" }, 404);

        return c.json({ order });
    } catch (error) {
        console.error("[GET /store/orders/:id] error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── GET /:slug — restaurant detail + menu + reviews ───────────────
storePublicRoutes.get("/:slug", async (c) => {
    try {
        const slug = c.req.param("slug");
        const supabase = getAdminClient(c.env);

        // 1. Resolve restaurant from Supabase
        const { data: results, error: restError } = await supabase
            .from("restaurants")
            .select("*")
            .eq("slug", slug)
            .eq("is_published", true)
            .limit(1);

        if (restError || !results || results.length === 0) {
            return c.json({ error: "Restaurant non trouvé" }, 404);
        }

        const rest = results[0];

        // 2. Get categories + products + reviews + showcase sections + team members from Supabase in parallel
        const [categoriesRes, productsRes, reviewsRes, showcaseRes, membersRes] = await Promise.all([
            supabase
                .from("categories")
                .select("id, name, description, sort_order")
                .eq("restaurant_id", rest.id)
                .order("sort_order"),
            supabase
                .from("products")
                .select("id, name, description, price, compare_at_price, image_url, is_available, category_id, sort_order, product_images(url, display_order)")
                .eq("restaurant_id", rest.id)
                .eq("is_available", true)
                .order("sort_order"),
            supabase
                .from("reviews")
                .select("id, rating, comment, response, created_at, customer_id")
                .eq("restaurant_id", rest.id)
                .eq("is_visible", true)
                .order("created_at", { ascending: false })
                .limit(20),
            supabase
                .from("showcase_sections")
                .select("id, section_type, title, subtitle, content, display_order, is_visible, settings")
                .eq("restaurant_id", rest.id)
                .eq("is_visible", true)
                .order("display_order"),
            supabase
                .from("restaurant_members")
                .select("id, user_id, role, status")
                .eq("restaurant_id", rest.id)
                .eq("status", "active"),
        ]);

        // Resolve customer names for reviews
        const reviewData = reviewsRes.data ?? [];
        const customerIds = [...new Set(reviewData.map(r => r.customer_id).filter(Boolean))];
        let customerMap: Record<string, string> = {};
        if (customerIds.length > 0) {
            const { data: users } = await supabase
                .from("users")
                .select("id, full_name")
                .in("id", customerIds);
            for (const u of users ?? []) {
                customerMap[u.id] = u.full_name ?? "Client";
            }
        }

        const memberRows = membersRes.data ?? [];
        const memberUserIds = [...new Set(memberRows.map(m => m.user_id).filter(Boolean))] as string[];
        let memberUsersMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
        if (memberUserIds.length > 0) {
            const { data: memberUsers } = await supabase
                .from("users")
                .select("id, full_name, avatar_url")
                .in("id", memberUserIds);

            for (const user of memberUsers ?? []) {
                memberUsersMap[user.id] = {
                    full_name: user.full_name ?? null,
                    avatar_url: user.avatar_url ?? null,
                };
            }
        }

        return c.json({
            restaurant: {
                id: rest.id,
                name: rest.name,
                slug: rest.slug,
                description: rest.description,
                logoUrl: rest.logo_url,
                coverUrl: rest.cover_url ?? rest.banner_url,
                address: rest.address,
                city: rest.city,
                phone: rest.phone,
                email: rest.email,
                cuisineType: rest.cuisine_type,
                primaryColor: rest.primary_color,
                openingHours: rest.opening_hours,
                rating: rest.rating,
                reviewCount: rest.review_count,
                orderCount: rest.order_count,
                isVerified: rest.is_verified,
                isPremium: rest.is_premium,
                hasDineIn: rest.has_dine_in,
                hasReservations: rest.has_reservations,
                totalTables: rest.total_tables,
                deliveryFee: rest.delivery_fee,
                minOrderAmount: rest.min_order_amount,
                // Dine-in fees (needed by client to compute order totals)
                dineInServiceFee: rest.dine_in_service_fee ?? 0,
                corkageFeeAmount: rest.corkage_fee_amount ?? 0,
                // Reservation slot config
                reservationSlotDuration: rest.reservation_slot_duration ?? 90,
                reservationOpenTime: rest.reservation_open_time ?? "10:00",
                reservationCloseTime: rest.reservation_close_time ?? "22:00",
                reservationSlotInterval: rest.reservation_slot_interval ?? 30,
                // Cancellation policies (shown to customers before booking/ordering)
                orderCancelPolicy: rest.order_cancel_policy ?? "flexible",
                orderCancelNoticeMinutes: rest.order_cancel_notice_minutes ?? 30,
                orderCancellationFeeAmount: rest.order_cancellation_fee_amount ?? 0,
                reservationCancelPolicy: rest.reservation_cancel_policy ?? "flexible",
                reservationCancelNoticeMinutes: rest.reservation_cancel_notice_minutes ?? 120,
                reservationCancellationFeeAmount: rest.reservation_cancellation_fee_amount ?? 0,
                // Loyalty program
                loyaltyEnabled: rest.loyalty_enabled ?? false,
                loyaltyPointsPerOrder: rest.loyalty_points_per_order ?? 10,
                loyaltyPointValue: rest.loyalty_point_value ?? 1,
                loyaltyMinRedeemPoints: rest.loyalty_min_redeem_points ?? 100,
                loyaltyRewardTiers: rest.loyalty_reward_tiers ?? [],
            },
            categories: categoriesRes.data ?? [],
            products: (productsRes.data ?? []).map((p: any) => {
                const extraImages: string[] = (p.product_images ?? [])
                    .sort((a: any, b: any) => a.display_order - b.display_order)
                    .map((img: any) => img.url);
                const images = p.image_url
                    ? [p.image_url, ...extraImages]
                    : extraImages;
                const { product_images: _, ...product } = p;
                return { ...product, images };
            }),
            reviews: reviewData.map(r => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                response: r.response,
                created_at: r.created_at,
                customerName: customerMap[r.customer_id] ?? "Client",
            })),
            showcaseSections: showcaseRes.data ?? [],
            teamMembers: memberRows.map((member: any) => {
                const profile = memberUsersMap[member.user_id];
                return {
                    id: member.id,
                    // SEC-014: user_id (UUID interne) exclu de la réponse publique
                    role: member.role,
                    name: profile?.full_name ?? "Membre",
                    imageUrl: profile?.avatar_url ?? null,
                };
            }),
        });
    } catch (error) {
        console.error("[GET /store/:slug] error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});
