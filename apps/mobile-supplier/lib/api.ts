import { supabase } from '@/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 20000);

if (!API_URL) {
    throw new Error('La variable EXPO_PUBLIC_API_URL est obligatoire pour les appels API.');
}

if (!Number.isFinite(API_TIMEOUT_MS) || API_TIMEOUT_MS <= 0) {
    throw new Error('EXPO_PUBLIC_API_TIMEOUT_MS doit être un nombre positif.');
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};

    if (headers instanceof Headers) {
        const normalized: Record<string, string> = {};
        headers.forEach((value, key) => {
            normalized[key] = value;
        });
        return normalized;
    }

    if (Array.isArray(headers)) {
        return Object.fromEntries(headers);
    }

    return { ...headers };
}

function buildHeaders(options?: RequestInit) {
    const headers = normalizeHeaders(options?.headers);

    if (options?.body instanceof FormData) {
        return headers;
    }

    return {
        'Content-Type': 'application/json',
        ...headers,
    };
}

function buildEndpoint(path: string) {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    if (path.startsWith('/')) {
        return `${API_URL}${path}`;
    }

    return `${API_URL}/${path}`;
}

function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}

async function fetchWithTimeout(endpoint: string, options: RequestInit) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        return await fetch(endpoint, {
            ...options,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function apiFetch(path: string, options?: RequestInit, token?: string) {
    const headers = buildHeaders(options);

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const endpoint = buildEndpoint(path);

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            return await fetchWithTimeout(endpoint, {
                ...options,
                headers,
            });
        } catch (error) {
            const canRetry = attempt === 0 && (isAbortError(error) || error instanceof TypeError);

            if (canRetry) {
                continue;
            }

            if (isAbortError(error)) {
                throw new Error('Le serveur met trop de temps à répondre. Réessayez.');
            }

            if (error instanceof TypeError) {
                throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
            }

            throw error;
        }
    }

    throw new Error('Requête API impossible.');
}

export async function authApiFetch(path: string, options?: RequestInit) {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    return apiFetch(path, options, token);
}

function inferMimeType(uri: string) {
    const lower = uri.toLowerCase();

    if (lower.endsWith('.png')) return { ext: 'png', type: 'image/png' };
    if (lower.endsWith('.webp')) return { ext: 'webp', type: 'image/webp' };
    if (lower.endsWith('.avif')) return { ext: 'avif', type: 'image/avif' };

    return { ext: 'jpg', type: 'image/jpeg' };
}

export async function uploadImage(uri: string, token?: string) {
    const { ext, type } = inferMimeType(uri);
    const formData = new FormData();

    formData.append('file', {
        uri,
        name: `upload.${ext}`,
        type,
    } as unknown as Blob);

    const response = await apiFetch('/api/upload', { method: 'POST', body: formData }, token);
    const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        key?: string;
    };

    if (!response.ok) {
        throw new Error(payload.error ?? 'Erreur d’upload');
    }

    if (!payload.url || !payload.key) {
        throw new Error('Réponse d’upload invalide.');
    }

    return { url: payload.url, key: payload.key };
}
