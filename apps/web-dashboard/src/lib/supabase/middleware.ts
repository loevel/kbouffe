import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

// Sous-domaine dédié à la section admin (Cloudflare Custom Domain → même worker).
// Tout le trafic hors /api et /admin y est réécrit en interne vers /admin/*,
// pour servir admin.kbouffe.com/xyz avec le contenu de kbouffe.com/admin/xyz.
const ADMIN_HOST = "admin.kbouffe.com";

function resolveRoleHomePath(role: string | undefined) {
    if (role === "admin") return "/admin";
    if (role === "merchant") return "/dashboard";
    if (role === "supplier") return "/dashboard/fournisseur";
    if (role === "livreur") return "/driver";
    return "/stores";
}

// Calcule le pathname "logique" à utiliser pour le routage/l'auth : sur
// admin.kbouffe.com, tout ce qui n'est pas déjà /api ou /admin est traité
// comme s'il était préfixé par /admin.
function resolveLogicalPathname(request: NextRequest) {
    const realPathname = request.nextUrl.pathname;
    const isAdminHost = (request.headers.get("host") ?? "") === ADMIN_HOST;
    const pathname =
        isAdminHost && !realPathname.startsWith("/api") && !realPathname.startsWith("/admin")
            ? `/admin${realPathname === "/" ? "" : realPathname}`
            : realPathname;
    return { realPathname, pathname };
}

// Applique la réécriture /admin/* si la requête vient de admin.kbouffe.com
// et qu'aucune redirection n'a eu lieu ; transfère les cookies Supabase posés
// par updateSession sur la nouvelle réponse.
function withAdminRewrite(
    request: NextRequest,
    response: NextResponse,
    realPathname: string,
    logicalPathname: string
) {
    if (realPathname === logicalPathname) return response;
    const url = request.nextUrl.clone();
    url.pathname = logicalPathname;
    const rewritten = NextResponse.rewrite(url, { request });
    response.cookies.getAll().forEach((cookie) => rewritten.cookies.set(cookie));
    return rewritten;
}

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Skip Supabase si les variables d'environnement ne sont pas configurées
    if (!supabaseUrl || !supabaseAnonKey) {
        const { realPathname, pathname } = resolveLogicalPathname(request);
        return withAdminRewrite(request, NextResponse.next({ request }), realPathname, pathname);
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

    const { realPathname, pathname } = resolveLogicalPathname(request);

    // Page de connexion admin — accessible publiquement (pas de protection)
    if (pathname === "/admin/login") {
        // Si déjà connecté en tant qu'admin, rediriger vers /admin
        if (user && role === "admin") {
            const url = request.nextUrl.clone();
            url.pathname = "/admin";
            return NextResponse.redirect(url);
        }
        // Sinon, laisser passer (afficher le formulaire de connexion)
        return withAdminRewrite(request, supabaseResponse, realPathname, pathname);
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

        // /dashboard/fournisseur réservé aux fournisseurs
        if (pathname.startsWith("/dashboard/fournisseur") && role !== "supplier") {
            const url = request.nextUrl.clone();
            url.pathname = homePath;
            return NextResponse.redirect(url);
        }

        // Dashboard / onboarding réservés aux restaurateurs (hors /dashboard/fournisseur)
        if (
            (
                (pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/fournisseur")) ||
                pathname.startsWith("/onboarding")
            ) &&
            role !== "merchant"
        ) {
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

    return withAdminRewrite(request, supabaseResponse, realPathname, pathname);
}
