import { NextRequest } from "next/server";
import { backendProxy } from "@/lib/api/backend";

export const PATCH  = (req: NextRequest) => backendProxy(req);
export const DELETE = (req: NextRequest) => backendProxy(req);
