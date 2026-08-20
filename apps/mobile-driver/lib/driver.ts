import { authApiFetch } from '@/lib/api';
import { envoyerOuDifferer } from '@/lib/outbox';
import type { Course, Gains, ProfilLivreur } from '@/lib/types';

/** Appels de l'espace livreur — miroir de apps/api/src/modules/driver. */

async function lire<T>(path: string): Promise<T> {
    const response = await authApiFetch(path);
    const payload = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
        throw new Error(payload.error ?? 'Le serveur n’a pas répondu correctement.');
    }

    return payload as T;
}

export async function chargerProfil(): Promise<ProfilLivreur> {
    return lire<ProfilLivreur>('/api/driver/me');
}

export async function chargerCourses(): Promise<Course[]> {
    const { orders } = await lire<{ orders: Course[] }>('/api/driver/orders');
    return orders ?? [];
}

export async function chargerHistorique(page = 1): Promise<{
    courses: Course[];
    hasMore: boolean;
    total: number;
}> {
    const data = await lire<{ orders: Course[]; hasMore: boolean; total: number }>(
        `/api/driver/history?page=${page}&limit=20`
    );
    return { courses: data.orders ?? [], hasMore: Boolean(data.hasMore), total: data.total ?? 0 };
}

export async function chargerGains(): Promise<Gains> {
    return lire<Gains>('/api/driver/earnings');
}

export async function definirDisponibilite(available: boolean) {
    return envoyerOuDifferer({
        path: '/api/driver/me',
        method: 'PATCH',
        body: { available },
    });
}

/** Prise en charge de la commande au restaurant. */
export async function prendreEnCharge(courseId: string) {
    return envoyerOuDifferer({
        path: `/api/driver/orders/${courseId}`,
        method: 'PATCH',
        body: { action: 'pickup' },
    });
}

/**
 * Remise au client. Le code est dicté par le client — le serveur le compare à
 * celui de la commande, l'app ne le connaît pas et ne peut donc pas le valider
 * hors ligne. Une remise saisie sans réseau part en file et sera refusée plus
 * tard si le code était faux : l'écran doit le dire, pas afficher « livré ».
 */
export async function remettreAuClient(courseId: string, code: string) {
    return envoyerOuDifferer({
        path: `/api/driver/orders/${courseId}`,
        method: 'PATCH',
        body: { action: 'deliver', delivery_code: code.trim().toUpperCase() },
    });
}

/**
 * Position pendant une course. Marquée silencieuse : si elle part en file, elle
 * sera rejouée sans déranger le livreur — une position d'il y a dix minutes ne
 * mérite pas une alerte.
 */
export async function envoyerPosition(courseId: string, lat: number, lng: number) {
    return envoyerOuDifferer({
        path: `/api/driver/tracking/${courseId}`,
        method: 'POST',
        body: { lat, lng },
        silencieuse: true,
    });
}
