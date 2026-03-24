import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

function resolveRoleHomePath(role: string | undefined) {
    if (role === "admin") return "/admin";
    if (role === "merchant") return "/dashboard";
    if (role === "livreur") return "/driver";
    return "/stores";
}

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Skip Supabase si les variables d'environnement ne sont pas configurées
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Rafraîchit la session si elle est expirée
    const { data: { user } } = await supabase.auth.getUser();
    const role = String(user?.user_metadata?.role ?? "").toLowerCase();
    const homePath = resolveRoleHomePath(role);

    const pathname = request.nextUrl.pathname;

    // Page de connexion admin — accessible publiquement (pas de protection)
    if (pathname === "/admin/login") {
        // Si déjà connecté en tant qu'admin, rediriger vers /admin
        if (user && role === "admin") {
            const url = request.nextUrl.clone();
            url.pathname = "/admin";
            return NextResponse.redirect(url);
        }
        // Sinon, laisser passer (afficher le formulaire de connexion)
        return supabaseResponse;
    }

    // Routes protégées → rediriger vers /admin/login si non connecté sur /admin
    // ou vers /login pour les autres routes protégées
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname.startsWith("/stores") || pathname.startsWith("/driver")) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/login";
            url.searchParams.set("redirectTo", pathname);
            return NextResponse.redirect(url);
        }

        // Admin réservé aux admins
        if (pathname.startsWith("/admin") && role !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname = homePath;
            return NextResponse.redirect(url);
        }

        // Dashboard / onboarding réservés aux restaurateurs
        if ((pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) && role !== "merchant") {
            const url = request.nextUrl.clone();
            url.pathname = homePath;
            return NextResponse.redirect(url);
        }

        // /driver réservé aux livreurs
        if (pathname.startsWith("/driver") && role !== "livreur") {
            const url = request.nextUrl.clone();
            url.pathname = homePath;
            return NextResponse.redirect(url);
        }
    }

    // Routes auth → rediriger vers la home adaptée au rôle si déjà connecté
    if (pathname === "/login" || pathname === "/register") {
        if (user) {
            const url = request.nextUrl.clone();
            url.pathname = homePath;
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
