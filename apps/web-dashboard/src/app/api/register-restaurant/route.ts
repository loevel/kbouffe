import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Génère un slug URL-friendly à partir du nom du restaurant
 */
function slugify(text: string): string {
  let slug = text.toLowerCase().trim();
  // Remplacer les caractères accentués
  slug = slug.replace(/[àáâãäå]/g, "a");
  slug = slug.replace(/[èéêë]/g, "e");
  slug = slug.replace(/[ìíîï]/g, "i");
  slug = slug.replace(/[òóôõö]/g, "o");
  slug = slug.replace(/[ùúûü]/g, "u");
  slug = slug.replace(/[ç]/g, "c");
  // Supprimer les caractères spéciaux
  slug = slug.replace(/[^a-z0-9\s-]/g, "");
  // Remplacer les espaces par des tirets
  slug = slug.replace(/[\s-]+/g, "-");
  // Supprimer les tirets en début/fin
  slug = slug.replace(/^-+|-+$/g, "");
  return slug;
}

/**
 * Génère un geohash simple basé sur lat/lng
 * Precision: 6 caractères (~1.2km)
 */
function encodeGeohash(lat: number, lng: number, precision = 6): string {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = "";
  let bit = 0;
  let ch = 0;
  let isLng = true;

  while (hash.length < precision) {
    if (isLng) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        ch |= 1 << (4 - bit);
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isLng = !isLng;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

/**
 * POST /api/register-restaurant
 * Crée un nouveau restaurant pour le marchand authentifié dans Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      restaurantName,
      fullName,
      phone,
      address,
      city,
      postalCode,
      lat,
      lng,
      cuisineType,
      saasPlanId,
      paymentProvider,
      paymentMomoNumber,
      paymentMomoName,
    } = body;

    // Commission rates mapping
    const commissionRates: Record<string, number> = {
      starter: 0,
      pro: 0,
      business: 0,
    };
    const commissionRate = saasPlanId ? (commissionRates[saasPlanId] ?? 0) : 0;

    // Validation
    if (!restaurantName?.trim()) {
      return NextResponse.json(
        { error: "Nom du restaurant requis" },
        { status: 400 }
      );
    }

    // Générer le slug unique
    const baseSlug = slugify(restaurantName);
    const timestamp = Date.now().toString(36);
    const slug = `${baseSlug}-${timestamp}`;

    // Coordonnées par défaut (Douala, Cameroun)
    const latitude = lat ?? 4.0511;
    const longitude = lng ?? 9.7679;
    const geohash = encodeGeohash(latitude, longitude);

    // Générer les IDs
    const restaurantId = crypto.randomUUID();
    const userId = user.id;

    // Créer le restaurant dans Supabase
    const { error: restaurantError } = await supabase
      .from("restaurants")
      .insert({
        id: restaurantId,
        owner_id: userId,
        name: restaurantName.trim(),
        slug,
        lat: latitude,
        lng: longitude,
        geohash,
        address: address?.trim() || "À définir",
        city: city?.trim() || "Douala",
        postal_code: postalCode || null,
        country: "CM",
        cuisine_type: cuisineType || "african",
        price_range: 2,
        rating: 0,
        review_count: 0,
        order_count: 0,
        is_published: true,
        is_verified: false,
        is_premium: saasPlanId === "pro" || saasPlanId === "business",
        saas_plan_id: saasPlanId || "starter",
        payment_provider: paymentProvider || null,
        payment_account_id: paymentProvider === "mobile_money" ? `${paymentMomoNumber}:${paymentMomoName}` : null,
        commission_rate: commissionRate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (restaurantError) {
      console.error("Supabase error creating restaurant:", restaurantError);
      throw restaurantError;
    }

    // Mettre à jour l'utilisateur dans Supabase
    const { error: userError } = await supabase
      .from("users")
      .update({
        full_name: fullName || user.user_metadata?.full_name || null,
        phone: phone || user.user_metadata?.phone || null,
        role: "merchant",
        restaurant_id: restaurantId,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (userError) {
      console.error("Supabase error updating user for restaurant:", userError);
      throw userError;
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurantId,
        name: restaurantName,
        slug,
      },
    });
  } catch (error: any) {
    console.error("Erreur création restaurant:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du restaurant" },
      { status: 500 }
    );
  }
}

