/**
 * Safe search helpers for PostgREST / Supabase.
 *
 * Supabase's .or() / .ilike() accept a filter grammar with special chars
 * (, . ( ) \). Interpolating raw user input breaks out of the intended
 * scope ("PostgREST injection"): an attacker can append extra filters,
 * enumerate rows, or crash the parser.
 *
 * Use escapeIlike(q) before building any .or("field.ilike.%${q}%,...") or
 * .ilike("col", `%${q}%`) expression.
 */

export function escapeIlike(input: string): string {
    return input
        .replace(/\\/g, "\\\\")  // backslash first
        .replace(/,/g, "\\,")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
}

/** Trim + cap length to avoid DoS on very long search strings. */
export function normalizeSearchQuery(input: string | undefined | null, maxLen = 100): string {
    if (!input) return "";
    return input.trim().slice(0, maxLen);
}
