/**
 * Utilitaires pour la géolocalisation et le reverse geocoding
 */

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface LocationResult {
    city: string;
    raw?: any;
}

const SUPPORTED_CITIES = ["Douala", "Yaoundé", "Garoua", "Kribi", "Bafoussam"];

/** Approximate center coordinates for supported cities */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
    "Douala":     { lat: 4.0511,  lon: 9.7679 },
    "Yaoundé":    { lat: 3.8480,  lon: 11.5021 },
    "Garoua":     { lat: 9.3014,  lon: 13.3936 },
    "Kribi":      { lat: 2.9491,  lon: 9.9106 },
    "Bafoussam":  { lat: 5.4764,  lon: 10.4175 },
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
    // 1. Try geo-distance matching first (most reliable)
    const nearestCity = findNearestCity(coords.latitude, coords.longitude);
    if (nearestCity) {
        return { city: nearestCity };
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
        
        // Walk through all address fields to find a match
        const addressValues = Object.values(data.address || {}) as string[];
        for (const val of addressValues) {
            const match = SUPPORTED_CITIES.find(c =>
                val.toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes(val.toLowerCase())
            );
            if (match) return { city: match, raw: data };
        }

        // Check state/region for broader match (e.g. "Littoral" → Douala)
        const region = (data.address?.state || data.address?.region || "").toLowerCase();
        if (region.includes("littoral")) return { city: "Douala", raw: data };
        if (region.includes("centre")) return { city: "Yaoundé", raw: data };
        if (region.includes("nord")) return { city: "Garoua", raw: data };
        if (region.includes("sud")) return { city: "Kribi", raw: data };
        if (region.includes("ouest")) return { city: "Bafoussam", raw: data };

        // No match at all — default to Douala
        return { city: "Douala", raw: data };
    } catch (error) {
        console.error("Reverse Geocoding Error:", error);
        // Even if Nominatim fails, use nearest city if within 150 km
        const fallback = findNearestCity(coords.latitude, coords.longitude);
        if (fallback) return { city: fallback };
        throw new Error("Impossible d'identifier votre ville. Sélectionnez-la manuellement.");
    }
}
