import { NextRequest } from "next/server";
import { backendProxy } from "@/lib/api/backend";

// The cart calls /api/coupons/validate, but the backend handler is
// couponValidateRoutes.post("/validate") mounted at /coupons/validate, i.e. the
// real endpoint is /api/coupons/validate/validate (which also keeps the
// SEC-011 rate limiter on /coupons/validate/*). Remap instead of changing the
// backend so the rate limiter scope is preserved.
const TARGET = "/api/coupons/validate/validate";

export const GET    = (req: NextRequest) => backendProxy(req, TARGET);
export const POST   = (req: NextRequest) => backendProxy(req, TARGET);
export const PUT    = (req: NextRequest) => backendProxy(req, TARGET);
export const PATCH  = (req: NextRequest) => backendProxy(req, TARGET);
export const DELETE = (req: NextRequest) => backendProxy(req, TARGET);
