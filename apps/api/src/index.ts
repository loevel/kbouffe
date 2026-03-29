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
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "./types";
import { authMiddleware } from "./middleware/auth";
import { userAuthMiddleware } from "./middleware/user-auth";
import { adminMiddleware } from "./middleware/admin";
import { requireModule } from "./middleware/module";

// ── Public routes ────────────────────────────────────────────────────
import { coreApi } from "@kbouffe/module-core";
const { storesRoutes, uploadRoutes, authRoutes, usersRoutes, securityRoutes, brandsRoutes, restaurantKycRoutes, brandsAdminRoutes } = coreApi;

import { capitalApi } from "@kbouffe/module-capital";
const { capitalRoutes, capitalAdminRoutes } = capitalApi;
import { catalogApi } from "@kbouffe/module-catalog/api";
const { menuRoute: menuRoutes, categoriesRoute: categoriesRoutes, productsRoute: productsRoutes } = catalogApi;
import { storePublicRoutes } from "./modules/store/store-public";
import { dashboardRoutes } from "./modules/store/dashboard";
import { restaurantRoutes } from "./modules/store/restaurant";
import { cuisineCategoriesPublicRoutes } from "./modules/cuisine-categories";

// ── Authenticated routes ─────────────────────────────────────────────
import { ordersApi } from "@kbouffe/module-orders";
const { ordersRoutes, paymentRoutes, paymentWebhookRoutes } = ordersApi;
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
app.use(
    "*",
    cors({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:8081",
            "http://localhost:8787",
            "https://kbouffe.com",
            "https://www.kbouffe.com",
        ],
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
api.route("/store", publicReservationsRoutes);             // public reservation booking
api.route("/store", publicProductReviewRoutes);            // public product reviews
api.route("/store", publicRestaurantReviewRoutes);          // public restaurant reviews
api.route("/coupons/validate", couponValidateRoutes);
api.route("/cuisine-categories", cuisineCategoriesPublicRoutes);
api.route("/payments/mtn", paymentWebhookRoutes);         // public webhooks
api.route("/sms", smsRoutes);
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

// ── Auth middleware for merchant routes ───────────────────────────────
const merchantPaths = [
    "/orders", "/categories", "/products", "/reservations",
    "/dashboard", "/coupons", "/tables", "/restaurant",
    "/customers", "/account", "/security", "/register-restaurant",
    "/marketing", "/notifications", "/payouts",
    "/payments/mtn", "/kyc", "/ads", "/team", "/zones", "/upload",
    "/capital", "/restaurant/brands", "/restaurant/kyc",
    "/payouts/payroll-report",
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
api.route("/notifications", notificationsRoutes);
api.route("/payouts", payoutsRoutes);
api.route("/payments/mtn", paymentRoutes);
api.route("/ads", adsRoutes);
api.route("/team", teamRoutes);
api.route("/upload", uploadRoutes);
api.route("/chat", chatRoutes);
api.route("/reviews", customerReviewRoutes);

// ── Merchant review management (uses authMiddleware via /restaurant path) ──
api.route("/restaurant/reviews", merchantReviewRoutes);
api.route("/restaurant/product-reviews", merchantProductReviewRoutes);

// ── Dark Kitchens / Multi-Marques + KYC ─────────────────────────────
api.route("/restaurant/brands", brandsRoutes);
api.route("/restaurant/kyc", restaurantKycRoutes);   // PATCH /restaurant/kyc

// ── KBouffe Capital (broker scoring) ────────────────────────────────
api.route("/capital", capitalRoutes);

// ── Marketplace — routes marchands ──────────────────────────────────
api.route("/marketplace", marketplaceMerchantRoutes);      // packs + souscriptions
api.route("/marketplace/trace", traceRoutes);              // traçabilité fournisseurs

// ── Admin routes ─────────────────────────────────────────────────────
api.route("/admin", adminRoutes);
api.route("/admin/marketplace", marketplaceAdminPureRoutes);      // admin packs
api.route("/admin/marketplace/suppliers", supplierAdminRoutes);   // admin KYC fournisseurs
api.route("/admin/capital/applications", capitalAdminRoutes);     // admin dossiers financement
api.route("/admin/brands", brandsAdminRoutes);                    // admin KYC restaurants + marques

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
//  Export Worker Handlers (Fetch + Queue)
// ═══════════════════════════════════════════════════════════════════════
import { processSmsQueue, type SmsMessage } from "./lib/sms-queue";

export default {
    fetch: app.fetch,
    async queue(batch: MessageBatch<SmsMessage>, env: Env): Promise<void> {
        await processSmsQueue(batch, env);
    },
};
