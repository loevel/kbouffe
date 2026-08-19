/**
 * API helpers — shared auth + restaurant resolution for all API routes.
 * Avoids duplicating the "get authenticated merchant's restaurant" logic.
 */
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface AuthContext {
  userId: string;
  restaurantId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export interface AdminAuthContext {
  userId: string;
  adminRole: string | null;
  supabase: Awaited<ReturnType<typeof createAdminClient>>;
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

  // Primary: the user's *active* restaurant pointer (users.restaurant_id).
  // This matches the backend auth middleware and, unlike querying
  // restaurants.owner_id with .maybeSingle(), works when an owner has
  // multiple restaurants (maybeSingle errors on >1 row → false 404).
  const { data: dbUser } = await supabase
    .from("users")
    .select("restaurant_id")
    .eq("id", user.id)
    .maybeSingle();

  let restaurantId = (dbUser as { restaurant_id?: string } | null)?.restaurant_id ?? undefined;

  // Fallback: check restaurant_members (staff accounts)
  if (!restaurantId) {
    const { data: memberData } = await supabase
      .from("restaurant_members")
      .select("restaurant_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    restaurantId = (memberData as { restaurant_id?: string } | null)?.restaurant_id ?? undefined;
  }

  // Dernier recours : la propriété. L'inscription pose users.restaurant_id et la
  // ligne d'équipe en écritures séparées ; si elles échouent, le restaurant reste
  // publié pendant que son propriétaire est traité comme n'en ayant aucun. Le
  // .order().limit(1) évite l'erreur de maybeSingle() sur plusieurs restaurants.
  if (!restaurantId) {
    const { data: owned } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    restaurantId = (owned as { id?: string } | null)?.id ?? undefined;
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
 *
 * The returned `supabase` instance uses the SERVICE ROLE KEY (bypasses RLS)
 * since admin routes need unrestricted access to all tables.
 * Auth verification still uses the anon client with the user's session cookie.
 */
export async function withAdmin(): Promise<
  | { ctx: AdminAuthContext; error?: never }
  | { ctx?: never; error: NextResponse }
> {
  // Use anon client only for auth check (reads the session cookie)
  const authClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  const { data: dbUser } = await authClient
    .from("users")
    .select("role, admin_role")
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

  // Service role client — bypasses RLS for all admin data operations
  const supabase = await createAdminClient();

  return {
    ctx: {
      userId: user.id,
      adminRole: (dbUser as any).admin_role ?? null,
      supabase,
    },
  };
}
