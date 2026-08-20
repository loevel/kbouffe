import { Linking, Platform } from 'react-native';

/** Distances et passage de relais vers l'application de navigation du téléphone. */

const RAYON_TERRE_KM = 6371;

function radians(deg: number) {
    return (deg * Math.PI) / 180;
}

/** Distance à vol d'oiseau, en kilomètres. */
export function distanceKm(
    depuis: { lat: number; lng: number },
    vers: { lat: number; lng: number }
): number {
    const dLat = radians(vers.lat - depuis.lat);
    const dLng = radians(vers.lng - depuis.lng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(radians(depuis.lat)) * Math.cos(radians(vers.lat)) * Math.sin(dLng / 2) ** 2;
    return RAYON_TERRE_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Formatage honnête : c'est une distance à vol d'oiseau, jamais un trajet.
 * L'écran doit donc l'annoncer comme telle, sinon le livreur planifie sur un
 * chiffre qui sous-estime systématiquement la route réelle.
 */
export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

export interface PointNavigable {
    lat: number | null;
    lng: number | null;
    label?: string | null;
    adresse?: string | null;
}

/** Vrai si le point peut être ouvert dans une carte. */
export function estNavigable(point: PointNavigable): boolean {
    return typeof point.lat === 'number' && typeof point.lng === 'number';
}

/**
 * Ouvre l'itinéraire dans l'app de navigation du téléphone.
 *
 * Kbouffe n'embarque pas sa propre carte : un livreur veut le guidage vocal, le
 * trafic et les cartes hors ligne qu'il a déjà, pas une carte au rabais dans une
 * app de plus. On passe donc le relais à Plans (iOS) ou Google Maps (Android).
 *
 * Sans coordonnées, on retombe sur l'adresse en texte — la recherche vaut mieux
 * que rien, mais elle peut se tromper de rue : l'écran doit le signaler.
 */
export async function ouvrirItineraire(point: PointNavigable): Promise<boolean> {
    const libelle = encodeURIComponent(point.label ?? point.adresse ?? 'Destination');

    let url: string;

    if (estNavigable(point)) {
        const coords = `${point.lat},${point.lng}`;
        url =
            Platform.OS === 'ios'
                ? `maps://?daddr=${coords}&dirflg=d`
                : `google.navigation:q=${coords}`;
    } else if (point.adresse) {
        const requete = encodeURIComponent(point.adresse);
        url =
            Platform.OS === 'ios'
                ? `maps://?daddr=${requete}`
                : `google.navigation:q=${requete}`;
    } else {
        return false;
    }

    try {
        await Linking.openURL(url);
        return true;
    } catch {
        // Certains appareils n'ont ni Plans ni Google Maps : le web fait le job.
        const secours = estNavigable(point)
            ? `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`
            : `https://www.google.com/maps/search/?api=1&query=${libelle}`;
        try {
            await Linking.openURL(secours);
            return true;
        } catch {
            return false;
        }
    }
}

/** Compose un numéro. Renvoie faux si l'appareil ne sait pas téléphoner. */
export async function appeler(numero: string | null): Promise<boolean> {
    if (!numero) return false;
    try {
        await Linking.openURL(`tel:${numero.replace(/\s/g, '')}`);
        return true;
    } catch {
        return false;
    }
}
