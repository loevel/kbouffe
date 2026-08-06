const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
    status: number;
    payload: unknown;

    constructor(message: string, status: number, payload: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}

function mergeHeaders(base: HeadersInit | undefined, extra: Record<string, string>): Headers {
    const headers = new Headers(base);
    Object.entries(extra).forEach(([key, value]) => headers.set(key, value));
    return headers;
}

export function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiFetch<T = unknown>(
    path: string,
    tokenOrOptions?: string | RequestInit,
    maybeOptions?: RequestInit | string
): Promise<T> {
    const token =
        typeof tokenOrOptions === 'string'
            ? tokenOrOptions
            : typeof maybeOptions === 'string'
                ? maybeOptions
                : undefined;

    const options: RequestInit | undefined =
        typeof tokenOrOptions === 'string'
            ? (typeof maybeOptions === 'object' ? maybeOptions : undefined)
            : tokenOrOptions;

    const headers = mergeHeaders(options?.headers, {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    // Without a timeout, a hung request never resolves nor rejects, so
    // screens that await apiFetch inside Promise.all (e.g. notifications.tsx)
    // stay stuck on their loading spinner forever. Abort after a fixed delay
    // so callers always get a settled promise to catch.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new ApiError('La requête a expiré, veuillez réessayer.', 0, null);
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }

    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
        const message =
            typeof payload === 'object' && payload !== null && 'error' in payload
                ? String((payload as { error?: unknown }).error ?? `Erreur HTTP ${res.status}`)
                : typeof payload === 'string' && payload.trim().length > 0
                    ? payload
                    : `Erreur HTTP ${res.status}`;
        throw new ApiError(message, res.status, payload);
    }

    return payload as T;
}
