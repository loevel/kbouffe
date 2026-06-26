/**
 * Utilitaires pour la géolocalisation et le reverse geocoding
 */

export interface Coordinates {
    latitude: number;
    longitude: number;
    /** Rayon de précision du fix, en mètres (Geolocation API). */
    accuracy?: number;
}

export interface LocationResult {
    city: string;
    /** true si le fix est trop imprécis pour distinguer les villes (WiFi/IP). */
    uncertain?: boolean;
    /** Précision du fix en km (pour le message à l'utilisateur). */
    accuracyKm?: number;
    raw?: any;
}

/**
 * Au-delà de ce rayon de précision, le fix (typiquement WiFi/IP) ne permet pas
 * de distinguer deux villes camerounaises proches → on demande confirmation
 * plutôt que d'imposer une ville (ex. Douala faussement détecté « Yaoundé »).
 */
const ACCURACY_THRESHOLD_M = 25000;

const SUPPORTED_CITIES = ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Kribi", "Limbé", "Nkongsamba", "Dschang", "Maroua", "Baganté", "Bamendjou"];

/** Approximate center coordinates for supported cities */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
    "Douala":      { lat: 4.0511,  lon: 9.7679 },
    "Yaoundé":     { lat: 3.8480,  lon: 11.5021 },
    "Garoua":      { lat: 9.3014,  lon: 13.3936 },
    "Kribi":       { lat: 2.9491,  lon: 9.9106 },
    "Bafoussam":   { lat: 5.4764,  lon: 10.4175 },
    "Limbé":       { lat: 4.0182,  lon: 9.2049 },
    "Nkongsamba":  { lat: 4.9526,  lon: 9.9340 },
    "Dschang":     { lat: 5.4487,  lon: 10.0536 },
    "Maroua":      { lat: 10.5916, lon: 14.3159 },
    "Baganté":     { lat: 5.1667,  lon: 10.5333 },
    "Bamendjou":   { lat: 5.3833,  lon: 10.4167 },
};

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find the nearest supported city within 80 km, or null */
function findNearestCity(lat: number, lon: number): string | null {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const [city, c] of Object.entries(CITY_COORDS)) {
        const d = haversineKm(lat, lon, c.lat, c.lon);
        if (d < bestDist) {
            bestDist = d;
            best = city;
        }
    }
    return bestDist <= 80 ? best : null;
}

/**
 * Obtient les coordonnées GPS de l'utilisateur
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("La géolocalisation n'est pas supportée par votre navigateur."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                let message = "Erreur de géolocalisation.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "L'accès à la position a été refusé.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "La position est indisponible.";
                        break;
                    case error.TIMEOUT:
                        message = "Délai d'attente dépassé.";
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Convertit des coordonnées en nom de ville (Reverse Geocoding)
 * Utilise Nominatim (OpenStreetMap) - Usage gratuit avec limites
 */
export async function getCityFromCoordinates(coords: Coordinates): Promise<LocationResult> {
    // Fix trop imprécis (WiFi/IP) → on ne peut pas distinguer les villes proches.
    const accuracyKm = coords.accuracy != null ? Math.round(coords.accuracy / 1000) : undefined;
    const uncertain = coords.accuracy != null && coords.accuracy > ACCURACY_THRESHOLD_M;

    // 1. Try geo-distance matching first (most reliable)
    const nearestCity = findNearestCity(coords.latitude, coords.longitude);
    if (nearestCity) {
        return { city: nearestCity, uncertain, accuracyKm };
    }

    // 2. Fallback: reverse geocoding via Nominatim
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'fr',
                    'User-Agent': 'Kbouffe-Web-Dashboard'
                }
            }
        );

        if (!response.ok) throw new Error("Erreur lors du reverse geocoding");

        const data = await response.json();

        // Hors Cameroun (ex. utilisateur à Montréal) → on ne devine pas.
        const countryCode = (data.address?.country_code || "").toLowerCase();
        if (countryCode && countryCode !== "cm") {
            throw new Error("Position hors de notre zone de service — sélectionnez votre ville manuellement.");
        }

        // Match sur le nom de ville dans les champs d'adresse
        const addressValues = Object.values(data.address || {}) as string[];
        for (const val of addressValues) {
            const match = SUPPORTED_CITIES.find(c =>
                val.toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes(val.toLowerCase())
            );
            if (match) return { city: match, uncertain, accuracyKm, raw: data };
        }

        // Région — du plus SPÉCIFIQUE au plus générique (sinon "Sud-Ouest" est
        // capté par "sud", "Nord-Ouest" par "nord", etc.)
        const region = (data.address?.state || data.address?.region || "").toLowerCase();
        const REGION_CITY: [string, string][] = [
            ["sud-ouest", "Limbé"], ["south west", "Limbé"],
            ["nord-ouest", "Bafoussam"], ["north west", "Bafoussam"],
            ["extrême-nord", "Maroua"], ["far north", "Maroua"],
            ["littoral", "Douala"],
            ["centre", "Yaoundé"],
            ["ouest", "Bafoussam"],
            ["sud", "Kribi"],
            ["nord", "Garoua"],
        ];
        for (const [needle, city] of REGION_CITY) {
            if (region.includes(needle)) return { city, uncertain, accuracyKm, raw: data };
        }

        // Au Cameroun mais ville/région non reconnue → choix manuel (pas de défaut Douala trompeur)
        throw new Error("Impossible d'identifier votre ville précisément — sélectionnez-la manuellement.");
    } catch (error) {
        // Si Nominatim échoue (réseau), tenter la ville la plus proche, sinon choix manuel
        if (error instanceof Error && error.message.includes("sélectionnez")) throw error;
        console.error("Reverse Geocoding Error:", error);
        const fallback = findNearestCity(coords.latitude, coords.longitude);
        if (fallback) return { city: fallback, uncertain, accuracyKm };
        throw new Error("Impossible d'identifier votre ville — sélectionnez-la manuellement.");
    }
}
