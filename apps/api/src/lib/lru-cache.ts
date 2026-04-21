/**
 * Simple LRU cache with TTL for per-isolate request caching.
 *
 * Cloudflare Workers run in isolates, so this cache is local to each instance.
 * It still reduces DB round-trips for repeated requests from the same user
 * within a single isolate's lifetime (typically several minutes).
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export class LRUCache<K, V> {
    private readonly map = new Map<K, CacheEntry<V>>();
    private readonly maxSize: number;
    private readonly ttlMs: number;

    constructor(maxSize: number, ttlMs: number) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    get(key: K): V | undefined {
        const entry = this.map.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) {
            this.map.delete(key);
            return undefined;
        }
        // Move to end (most recently used)
        this.map.delete(key);
        this.map.set(key, entry);
        return entry.value;
    }

    set(key: K, value: V): void {
        if (this.map.has(key)) this.map.delete(key);
        else if (this.map.size >= this.maxSize) {
            // Evict oldest entry
            const oldest = this.map.keys().next().value;
            if (oldest !== undefined) this.map.delete(oldest);
        }
        this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }

    delete(key: K): void {
        this.map.delete(key);
    }
}
