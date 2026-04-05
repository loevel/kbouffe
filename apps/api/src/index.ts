/**
 * Kbouffe API — Hono Worker
 *
 * Public + authenticated API serving both the mobile app and the web client.
 * Deployed as a standalone Cloudflare Worker.
 *
 * All routes live under /api/* to match the path convention used by
 * both the mobile-client and the web-dashboard proxy.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "./types";
import { authMiddleware } from "./middleware/auth";
import { userAuthMiddleware } from "./middleware/user-auth";
import { adminMiddleware } from "./middleware/admin";
import { requireModule } from "./middleware/module";

// ── Public routes ────────────────────────────────────────────────────
import { coreApi } from "@kbouffe/module-core";
const { storesRoutes, uploadRoutes, authRoutes, usersRoutes, securityRoutes, brandsRoutes, restaurantKycRoutes, brandsAdminRoutes, billingRoutes, adminBillingRoutes } = coreApi;

import { capitalApi } from "@kbouffe/module-capital";
const { capitalAdminRoutes } = capitalApi;
import { catalogApi } from "@kbouffe/module-catalog/api";
const { menuRoute: menuRoutes, categoriesRoute: categoriesRoutes, productsRoute: productsRoutes } = catalogApi;
import { storePublicRoutes } from "./modules/store/store-public";
import { dashboardRoutes } from "./modules/store/dashboard";
import { restaurantRoutes } from "./modules/store/restaurant";
import { cuisineCategoriesPublicRoutes } from "./modules/cuisine-categories";

// ── Authenticated routes ─────────────────────────────────────────────
import { ordersApi } from "@kbouffe/module-orders";
const { ordersRoutes, paymentRoutes, paymentWebhookRoutes, caisseRoutes } = ordersApi;
import { zonesRoutes as deliveryZonesRoutes } from "@kbouffe/module-orders";
import { reservationsApi } from "@kbouffe/module-reservations";
const { reservationsRoutes, publicReservationsRoutes, tablesRoutes, zonesRoutes: tableZonesRoutes } = reservationsApi;
import { crmApi } from "@kbouffe/module-crm";
const { customersRoutes } = crmApi;
import { marketingApi } from "@kbouffe/module-marketing";
const {
    marketingRoutes,
    adsRoutes,
    couponsRoutes,
    couponValidateRoutes,
    emailTemplatesRoutes,
    giftCardRoutes,
    giftCardPublicRoutes,
    smsRoutes,
} = marketingApi;
import { hrApi } from "@kbouffe/module-hr";
const { teamRoutes, payoutsRoutes } = hrApi;
import { chatApi } from "@kbouffe/module-chat";
const { chatRoutes } = chatApi;
import { notificationsRoutes } from "./modules/core/notifications";
import {
    customerReviewRoutes,
    merchantReviewRoutes,
    merchantProductReviewRoutes,
    publicProductReviewRoutes,
    publicRestaurantReviewRoutes,
} from "./modules/reviews";
import supplierAnalyticsRouter from "./modules/supplier/analytics";
import { predictionsRouter, profitabilityRouter } from "./modules/supplier";

// ── Admin routes ─────────────────────────────────────────────────────
import { adminRoutes } from "./modules/admin";

// ── Marketplace B2B Fournisseurs ────────────────────────────────────
import {
    marketplacePublicRoutes,
    marketplaceMerchantRoutes,
    marketplaceAdminRoutes as marketplaceAdminPureRoutes,
    marketplaceWebhookRoutes,
    suppliersRoutes,
    traceRoutes,
    supplierAdminRoutes,
} from "@kbouffe/module-marketplace";

// ═══════════════════════════════════════════════════════════════════════
//  Root app — health check lives at / (outside the /api scope)
// ═══════════════════════════════════════════════════════════════════════
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Global middleware ────────────────────────────────────────────────
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
    "*",
    cors({
        // SEC-016: Localhost origins autorisés uniquement en développement (ENVIRONMENT !== "production")
        origin: (origin: string, c: any) => {
            const PROD_ORIGINS = ["https://kbouffe.com", "https://www.kbouffe.com"];
            const DEV_ORIGINS  = [
                "http://localhost:3000", "http://localhost:3001",
                "http://localhost:3002", "http://localhost:8081", "http://localhost:8787",
            ];
            const isProduction = c.env?.ENVIRONMENT === "production";
            const allowed = isProduction ? PROD_ORIGINS : [...PROD_ORIGINS, ...DEV_ORIGINS];
            return allowed.includes(origin) ? origin : null;
        },
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: 86400,
    }),
);

// ── Default Supabase Client ──────────────────────────────────────────
app.use("*", async (c, next) => {
    if (c.env.SUPABASE_URL && c.env.SUPABASE_ANON_KEY) {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        c.set("supabase", supabase);
    }
    await next();
});

// ── Health check — root ──────────────────────────────────────────────
app.get("/", (c) =>
    c.json({ name: "Kbouffe API", version: "1.0.0", status: "ok" }),
);

// ═══════════════════════════════════════════════════════════════════════
//  /api/* — all business routes
// ═══════════════════════════════════════════════════════════════════════
const api = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Public routes (no auth) ──────────────────────────────────────────
api.route("/stores", storesRoutes);
api.route("/menu", menuRoutes);
api.route("/store", storePublicRoutes);                   // guest orders
api.route("/store/gift-cards", giftCardPublicRoutes);     // validation carte cadeau (public checkout)
api.route("/store", publicReservationsRoutes);             // public reservation booking
api.route("/store", publicProductReviewRoutes);            // public product reviews
api.route("/store", publicRestaurantReviewRoutes);          // public restaurant reviews
api.route("/coupons/validate", couponValidateRoutes);

// SEC-011: Rate limiting on public coupon validation (5 req/min/IP — prevents brute-force)
const couponRateLimiter = (() => {
    const attempts = new Map<string, { count: number; resetAt: number }>();
    return async (c: any, next: any) => {
        const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
        const now = Date.now();
        const rec = attempts.get(ip);
        if (!rec || now > rec.resetAt) {
            attempts.set(ip, { count: 1, resetAt: now + 60_000 });
        } else {
            rec.count++;
            if (rec.count > 5) return c.json({ valid: false, error: "Trop de tentatives. Réessayez dans 1 minute." }, 429);
        }
        await next();
    };
})();
api.use("/coupons/validate/*", couponRateLimiter);
api.route("/cuisine-categories", cuisineCategoriesPublicRoutes);
api.route("/payments/mtn", paymentWebhookRoutes);         // public webhooks
api.route("/auth", authRoutes);
api.route("/verify-turnstile", authRoutes); // Combined in authRoutes
api.route("/sync-user", authRoutes);       // Combined in authRoutes

// ── Marketplace — routes publiques (annuaire fournisseurs, inscription) ─
api.route("/marketplace", marketplacePublicRoutes);        // packs visibles

// Supplier self-service routes require auth (register + /me/*)
// IMPORTANT: middleware MUST be registered BEFORE api.route() in Hono,
// otherwise matched routes bypass the middleware entirely.
// Using userAuthMiddleware (not authMiddleware) because suppliers have no restaurant.
api.use("/marketplace/suppliers/register", userAuthMiddleware);
api.use("/marketplace/suppliers/me", userAuthMiddleware);
api.use("/marketplace/suppliers/me/*", userAuthMiddleware);
api.use("/marketplace/suppliers/supplier-products/*", userAuthMiddleware);

api.route("/marketplace/suppliers", suppliersRoutes);      // annuaire + inscription

// ── Rate limiting on authentication endpoints (CRIT-004) ────────────
// In-process limiter: 10 attempts / minute per IP.
// Complement with Cloudflare Rate Limiting Rules on /api/auth/* in production.
const authRateLimiter = (() => {
    const attempts = new Map<string, { count: number; resetAt: number }>();
    return async (c: any, next: any) => {
        const ip =
            c.req.header("CF-Connecting-IP") ??
            c.req.header("X-Forwarded-For") ??
            "unknown";
        const now = Date.now();
        const WINDOW = 60_000;
        const MAX = 10;
        const rec = attempts.get(ip);
        if (!rec || now > rec.resetAt) {
            attempts.set(ip, { count: 1, resetAt: now + WINDOW });
        } else {
            rec.count++;
            if (rec.count > MAX) {
                return c.json(
                    { error: "Trop de tentatives. Réessayez dans 1 minute." },
                    429,
                );
            }
        }
        // Cleanup old entries periodically
        if (attempts.size > 5000) {
            const nowTs = Date.now();
            for (const [k, v] of attempts) {
                if (nowTs > v.resetAt) attempts.delete(k);
            }
        }
        await next();
    };
})();

api.use("/auth/*", authRateLimiter);
api.use("/auth", authRateLimiter);

// ── Auth middleware for merchant routes ───────────────────────────────
const merchantPaths = [
    "/orders", "/categories", "/products", "/reservations",
    "/dashboard", "/coupons", "/gift-cards", "/tables", "/restaurant",
    "/customers", "/account", "/security", "/register-restaurant",
    "/marketing", "/notifications", "/payouts", "/sms",
    "/payments/mtn", "/kyc", "/ads", "/team", "/zones", "/upload",
    "/restaurant/brands", "/restaurant/kyc",
    "/payouts/payroll-report",
    "/caisse", "/supplier",
] as const;

// Marketplace merchant routes (trace + product management) require auth
api.use("/marketplace/trace/*", authMiddleware);
api.use("/marketplace/trace", authMiddleware);
api.use("/marketplace/my-packs/*", authMiddleware);
api.use("/marketplace/my-packs", authMiddleware);
api.use("/marketplace/subscriptions/*", authMiddleware);
api.use("/marketplace/subscriptions", authMiddleware);
api.use("/marketplace/purchase/*", authMiddleware);
api.use("/marketplace/purchase", authMiddleware);


// Chat uses userAuthMiddleware (works for clients + merchants, no restaurant required)
api.use("/chat/*", userAuthMiddleware);
api.use("/chat", userAuthMiddleware);

// Reviews uses userAuthMiddleware (customers submit reviews, no restaurant required)
api.use("/reviews/*", userAuthMiddleware);
api.use("/reviews", userAuthMiddleware);

for (const path of merchantPaths) {
    api.use(`${path}/*`, authMiddleware);
    api.use(path, authMiddleware);
}

// ── Module requirements ──────────────────────────────────────────────
const moduleRequirements: Record<string, string> = {
    "/reservations": "reservations",
    "/tables": "reservations",
    "/zones": "reservations",
    "/orders/zones": "orders",
    "/marketing": "marketing",
    "/coupons": "marketing",
    "/gift-cards": "marketing",
    "/ads": "marketing",
    "/team": "hr",
    "/payouts": "hr",
};

for (const [path, moduleName] of Object.entries(moduleRequirements)) {
    api.use(`${path}/*`, requireModule(moduleName));
    api.use(path, requireModule(moduleName));
}

// ── Admin middleware ─────────────────────────────────────────────────
api.use("/admin/*", adminMiddleware);
api.use("/admin", adminMiddleware);

// ── Merchant routes ──────────────────────────────────────────────────
api.route("/orders", ordersRoutes);
api.route("/caisse", caisseRoutes);
api.route("/categories", categoriesRoutes);
api.route("/products", productsRoutes);
api.route("/reservations", reservationsRoutes);
api.route("/tables", tablesRoutes);
api.route("/zones", tableZonesRoutes);            // zones de salle
api.route("/orders/zones", deliveryZonesRoutes);  // zones de livraison
api.route("/dashboard", dashboardRoutes);
api.route("/restaurant", restaurantRoutes);
api.route("/account", usersRoutes);
api.route("/security", securityRoutes);
api.route("/register-restaurant", authRoutes);
api.route("/kyc", authRoutes);
api.route("/upload", uploadRoutes);
api.route("/marketing", marketingRoutes);
api.route("/email-templates", emailTemplatesRoutes);
api.route("/notifications", notificationsRoutes);
api.route("/payouts", payoutsRoutes);
api.route("/payments/mtn", paymentRoutes);
api.route("/ads", adsRoutes);
api.route("/team", teamRoutes);
api.route("/upload", uploadRoutes);
api.route("/sms", smsRoutes);
api.route("/gift-cards", giftCardRoutes);
api.route("/chat", chatRoutes);
api.route("/reviews", customerReviewRoutes);

// ── Merchant review management (uses authMiddleware via /restaurant path) ──
api.route("/restaurant/reviews", merchantReviewRoutes);
api.route("/restaurant/product-reviews", merchantProductReviewRoutes);

// ── Supplier Analytics (dashboard metrics) ────────────────────────────────
api.route("/supplier", supplierAnalyticsRouter);
api.route("/supplier", predictionsRouter);
api.route("/supplier", profitabilityRouter);

// ── Dark Kitchens / Multi-Marques + KYC ─────────────────────────────
api.route("/restaurant/brands", brandsRoutes);
api.route("/restaurant/kyc", restaurantKycRoutes);   // PATCH /restaurant/kyc

// ── Facturation TVA (SaaS + Marketplace) ────────────────────────────
api.use("/billing/*", authMiddleware);
api.route("/billing", billingRoutes);                // merchant: factures restaurant

// ── Marketplace — routes marchands ──────────────────────────────────
api.route("/marketplace", marketplaceMerchantRoutes);      // packs + souscriptions
api.route("/marketplace/trace", traceRoutes);              // traçabilité fournisseurs

// ── Admin routes ─────────────────────────────────────────────────────
api.route("/admin", adminRoutes);
api.route("/admin/marketplace", marketplaceAdminPureRoutes);      // admin packs
api.route("/admin/marketplace/suppliers", supplierAdminRoutes);   // admin KYC fournisseurs
api.route("/admin/capital/applications", capitalAdminRoutes);     // admin dossiers financement
api.route("/admin/brands", brandsAdminRoutes);                    // admin KYC restaurants + marques
api.route("/admin/billing", adminBillingRoutes);                  // admin factures + déclaration TVA DGI

// ── Mount /api/* on root ─────────────────────────────────────────────
app.route("/api", api);

// ── 404 fallback ─────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: "Route non trouvée" }, 404));

// ── Global error handler ─────────────────────────────────────────────
app.onError((err, c) => {
    console.error("[API Error]", err);
    return c.json({ error: "Erreur serveur interne" }, 500);
});

// ═══════════════════════════════════════════════════════════════════════
//  Export Worker Handlers (Fetch + Queue + Scheduled)
// ═══════════════════════════════════════════════════════════════════════
import { processSmsQueue, type SmsMessage } from "./lib/sms-queue";

async function runDataPurge(env: Env): Promise<void> {
    const serviceKey = (env as any).SUPABASE_SERVICE_ROLE_KEY ?? (env as any).SUPABASE_ANON_KEY;
    if (!serviceKey) return;
    const db = createClient((env as any).SUPABASE_URL, serviceKey);

    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const tenYearsAgo  = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Purge old completed ad campaigns (> 3 ans)
    await db.from("ad_campaigns").delete().eq("status", "completed").lt("ends_at", threeYearsAgo);

    // 2. Purge old coupon uses (> 3 ans — données marketing, non fiscales)
    await db.from("coupon_uses").delete().lt("used_at", threeYearsAgo);

    // 3. Anonymise les données PII des commandes > 10 ans (obligation fiscale mais PDCP Loi 2010/012)
    await db
        .from("orders")
        .update({ customer_name: "[archivé]", customer_phone: null, delivery_address: null })
        .lt("created_at", tenYearsAgo)
        .neq("customer_name", "[archivé]");
}

export default {
    fetch: app.fetch,
    async queue(batch: MessageBatch<SmsMessage>, env: Env): Promise<void> {
        await processSmsQueue(batch, env);
    },
    async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        ctx.waitUntil(runDataPurge(env));
    },
};
