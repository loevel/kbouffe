/**
 * API helpers — shared auth + restaurant resolution for all API routes.
 * Avoids duplicating the "get authenticated merchant's restaurant" logic.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AuthContext {
  userId: string;
  restaurantId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export interface AdminAuthContext {
  userId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Authenticates the request and resolves the merchant's restaurant.
 * Returns either { ctx } or { error } — caller should check.
 */
export async function withAuth(): Promise<
  | { ctx: AuthContext; error?: never }
  | { ctx?: never; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("restaurant_id")
    .eq("id", user.id)
    .maybeSingle();

  let restaurantId = dbUser?.restaurant_id;

  // Fallback to restaurant_members if not in user profile
  if (!restaurantId) {
    const { data: memberData } = await supabase
      // @ts-expect-error — Table might be missing from generated types
      .from("restaurant_members")
      .select("restaurant_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    
    // @ts-expect-error — Property might be missing from inferred type
    restaurantId = memberData?.restaurant_id;
  }

  if (!restaurantId) {
    return {
      error: NextResponse.json(
        { error: "Restaurant non trouvé ou accès non autorisé" },
        { status: 404 }
      ),
    };
  }

  return {
    ctx: {
      userId: user.id,
      restaurantId,
      supabase,
    },
  };
}

/**
 * Standard error response.
 */
export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Authenticates the request and verifies the user is a platform admin.
 * Returns either { ctx } or { error } — caller should check.
 */
export async function withAdmin(): Promise<
  | { ctx: AdminAuthContext; error?: never }
  | { ctx?: never; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!dbUser || dbUser.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      ),
    };
  }

  return {
    ctx: {
      userId: user.id,
      supabase,
    },
  };
}
