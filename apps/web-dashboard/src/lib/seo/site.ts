/**
 * Constantes SEO partagées par robots.txt et sitemap.xml.
 *
 * L'URL canonique est le domaine public, jamais NEXT_PUBLIC_APP_URL : en
 * production celui-ci pointe sur l'URL *.workers.dev, qui référencerait le
 * site en double aux yeux des moteurs.
 */
export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://kbouffe.com";

/** Pages publiques stables listées dans le sitemap. */
export const STATIC_ROUTES: {
    path: string;
    changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
    priority: number;
}[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/stores", changeFrequency: "daily", priority: 0.9 },
    { path: "/stores/search", changeFrequency: "daily", priority: 0.7 },
    { path: "/stores/offers", changeFrequency: "daily", priority: 0.7 },
    { path: "/pour-les-clients", changeFrequency: "monthly", priority: 0.8 },
    { path: "/pour-les-restaurateurs", changeFrequency: "monthly", priority: 0.8 },
    { path: "/pour-les-agriculteurs", changeFrequency: "monthly", priority: 0.6 },
    { path: "/agriculteurs", changeFrequency: "monthly", priority: 0.5 },
    { path: "/partenaires", changeFrequency: "monthly", priority: 0.5 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
    { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Chemins interdits aux robots : espaces authentifiés, tunnel de commande
 * (pages transactionnelles sans valeur de recherche) et API.
 * Reste indexable : la vitrine marketing, /stores, /stores/search,
 * /stores/offers et les pages restaurant /r/<slug>.
 */
/**
 * Routes API que les robots DOIVENT pouvoir appeler. Les vitrines /r/<slug> et
 * la découverte /stores n'ont aucun contenu rendu côté serveur : tout arrive
 * d'un fetch client vers ces routes. Les laisser sous le `Disallow: /api/`
 * ci-dessous ferait indexer des pages vides — Googlebot n'exécute pas un fetch
 * vers une URL interdite par robots.txt.
 * Le match le plus long l'emporte, donc ces Allow battent `/api/`.
 */
export const CRAWLABLE_API_PATHS = [
    "/api/store/",
    "/api/stores",
    "/api/homepage-sections",
];

/**
 * Sous-chemins privés de /api/store/ : plus longs que le Allow ci-dessus, ils
 * reprennent donc le dessus (commandes, paiements, réservations).
 */
export const PRIVATE_API_PATHS = [
    "/api/store/order",
    "/api/store/payment/",
    "/api/store/*/reservations",
];

export const DISALLOWED_PATHS = [
    "/api/",
    "/admin",
    "/dashboard",
    "/driver",
    "/onboarding",
    "/auth/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/stores/cart",
    "/stores/checkout",
    "/stores/confirmation",
    "/stores/orders",
    "/stores/profile",
    "/stores/addresses",
    "/stores/payments",
    "/stores/favorites",
    "/stores/preferences",
    "/stores/security",
    "/stores/notifications",
    "/stores/reservations",
    "/stores/support",
];
