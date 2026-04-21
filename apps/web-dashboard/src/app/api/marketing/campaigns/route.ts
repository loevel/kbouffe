import { NextRequest } from "next/server";
import { backendProxy } from "@/lib/api/backend";

export const GET  = (req: NextRequest) => backendProxy(req);
export const POST = (req: NextRequest) => backendProxy(req);
