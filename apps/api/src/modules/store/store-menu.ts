/**
 * Public menu browsing routes — categories, products, product detail.
 *
 * Placeholder for dedicated menu endpoints.
 * Category/product data for a specific restaurant is served via GET /store/:slug (store-info.ts).
 */
import { Hono } from "hono";
import type { Env } from "../../types";

export const storeMenuRoutes = new Hono<{ Bindings: Env }>();
