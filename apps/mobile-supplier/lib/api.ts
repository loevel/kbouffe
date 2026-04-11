import { supabase } from '@/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function buildHeaders(options?: RequestInit) {
    if (options?.body instanceof FormData) {
        return {
            ...(options.headers as Record<string, string> ?? {}),
        };
    }

    return {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> ?? {}),
    };
}

export async function apiFetch(path: string, options?: RequestInit, token?: string) {
    const headers = buildHeaders(options);

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });
}

export async function authApiFetch(path: string, options?: RequestInit) {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

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
    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.error ?? 'Erreur d’upload');
    }

    return payload as { url: string; key: string };
}
