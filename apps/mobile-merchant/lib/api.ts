const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function apiFetch(path: string, options?: RequestInit, token?: string) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> ?? {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    return res;
}
