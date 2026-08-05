/**
 * snake_case <-> camelCase helpers.
 *
 * Several restaurant fields are read back by the dashboard as camelCase
 * (e.g. `restaurant.reservationSlotDuration`) while every DB row is
 * snake_case. Without aliasing, those reads are always `undefined` and
 * silently fall back to hardcoded defaults in the UI — indistinguishable
 * from data loss even when the value is correctly saved in the DB.
 */
export function snakeToCamel(key: string): string {
    return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Merge in camelCase aliases for every key of `row`, without dropping the originals. */
export function withCamelAliases<T extends Record<string, unknown>>(row: T): T {
    const aliases: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
        const camelKey = snakeToCamel(key);
        if (camelKey !== key) aliases[camelKey] = value;
    }
    return { ...aliases, ...row };
}
