import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type R2Bucket = import("@cloudflare/workers-types").R2Bucket;

/**
 * Given a tenant registration record, return a client for accessing tenant data.
 */
export function getTenantClientFromRecord(record: { provider?: string } & Record<string, any>, env: Record<string, any>): SupabaseClient {
  const provider = record.provider ?? "supabase";
  
  if (provider === "supabase") {
    const url = env.SUPABASE_URL as string | undefined;
    const key = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    if (!url || !key) throw new Error("Supabase env not configured in Cloudflare env");
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  throw new Error(`Tenant provider '${provider}' not supported`);
}

/**
 * Get R2 bucket for image storage
 */
export async function getImagesBucket() {
  const { env } = await getCloudflareContext();
  const bucket = (env as unknown as Record<string, unknown>).IMAGES_BUCKET as R2Bucket | undefined;
  if (!bucket) {
    throw new Error("R2 bucket binding not available");
  }
  return bucket;
}
