/**
 * Public store routes — customer-facing, no auth required.
 *
 * Combines sub-routers and re-exports `storePublicRoutes` so that the
 * existing import in apps/api/src/index.ts continues to work unchanged.
 *
 * GET  /store/:slug         — restaurant detail + menu + reviews  (store-info)
 * POST /store/order         — create a guest order                (store-orders)
 * GET  /store/orders/:id    — track order by ID                   (store-orders)
 */
import { Hono } from "hono";
import { publicReservationsRoutes } from "@kbouffe/module-reservations";
import type { Env } from "../../types";
import { storeMenuRoutes } from "./store-menu";
import { storeOrdersRoutes } from "./store-orders";
import { storeInfoRoutes } from "./store-info";

export const storePublicRoutes = new Hono<{ Bindings: Env }>();

storePublicRoutes.route("/", publicReservationsRoutes);
storePublicRoutes.route("/", storeMenuRoutes);
storePublicRoutes.route("/", storeOrdersRoutes);
storePublicRoutes.route("/", storeInfoRoutes);
