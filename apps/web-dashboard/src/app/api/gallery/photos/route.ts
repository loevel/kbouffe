import { NextRequest } from "next/server";
import { backendProxy } from "@/lib/api/backend";

export const POST = (req: NextRequest) => backendProxy(req);
