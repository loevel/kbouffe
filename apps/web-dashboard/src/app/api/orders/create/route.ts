import { NextRequest } from "next/server";
import { backendProxy } from "@/lib/api/backend";

// The POS posts to /api/orders/create, but the backend creates orders via
// POST /api/orders (ordersRoutes.post("/")). There is no /orders/create route,
// so forwarding as-is 404s. Remap to /api/orders.
const TARGET = "/api/orders";

export const GET    = (req: NextRequest) => backendProxy(req, TARGET);
export const POST   = (req: NextRequest) => backendProxy(req, TARGET);
export const PUT    = (req: NextRequest) => backendProxy(req, TARGET);
export const PATCH  = (req: NextRequest) => backendProxy(req, TARGET);
export const DELETE = (req: NextRequest) => backendProxy(req, TARGET);
