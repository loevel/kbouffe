import { NextRequest } from "next/server";
import { backendProxy } from "@/lib/api/backend";

// The frontend (POS MenuBrowserPanel, upsells) calls /api/menu/products, but the
// backend exposes the merchant product list at /api/products. Forwarding as-is
// would hit the public /menu/:slug route (slug="products") and 404, so we remap.
const TARGET = "/api/products";

export const GET    = (req: NextRequest) => backendProxy(req, TARGET);
export const POST   = (req: NextRequest) => backendProxy(req, TARGET);
export const PUT    = (req: NextRequest) => backendProxy(req, TARGET);
export const PATCH  = (req: NextRequest) => backendProxy(req, TARGET);
export const DELETE = (req: NextRequest) => backendProxy(req, TARGET);
