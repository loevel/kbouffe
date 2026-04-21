/**
 * Durable Object — Sliding-window rate limiter.
 *
 * Each DO instance handles one key (IP or userId).
 * The state (attempt timestamps) is shared across all isolates for that key.
 *
 * Usage (from a Worker):
 *   const id = env.RATE_LIMITER.idFromName(key);
 *   const stub = env.RATE_LIMITER.get(id);
 *   const { allowed, retryAfter } = await stub.fetch(new Request("https://dummy", {
 *     method: "POST",
 *     body: JSON.stringify({ windowMs: 60000, maxRequests: 10 }),
 *   })).then(r => r.json());
 */
export class RateLimiterDO {
    private state: DurableObjectState;
    private timestamps: number[] = [];

    constructor(state: DurableObjectState) {
        this.state = state;
    }

    async fetch(request: Request): Promise<Response> {
        const { windowMs, maxRequests } = await request.json<{ windowMs: number; maxRequests: number }>();
        const now = Date.now();

        // Load persisted timestamps
        const stored = await this.state.storage.get<number[]>("ts");
        this.timestamps = (stored ?? []).filter(ts => now - ts < windowMs);

        const allowed = this.timestamps.length < maxRequests;
        let retryAfter = 0;

        if (allowed) {
            this.timestamps.push(now);
            await this.state.storage.put("ts", this.timestamps);
        } else {
            // When next slot will open
            retryAfter = Math.ceil((this.timestamps[0]! + windowMs - now) / 1000);
        }

        return Response.json({ allowed, retryAfter, remaining: Math.max(0, maxRequests - this.timestamps.length) });
    }
}

/**
 * Helper to call the rate limiter DO from a Hono route.
 * Returns { allowed, retryAfter, remaining }.
 */
export async function checkRateLimit(
    doBinding: DurableObjectNamespace,
    key: string,
    options: { windowMs: number; maxRequests: number },
): Promise<{ allowed: boolean; retryAfter: number; remaining: number }> {
    const id = doBinding.idFromName(key);
    const stub = doBinding.get(id);
    const res = await stub.fetch(new Request("https://do-rate-limiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
    }));
    return res.json();
}
