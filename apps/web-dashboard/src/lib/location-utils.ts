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
        
        // Extraire la ville, la commune ou le village
        const cityFound = data.address.city || 
                          data.address.town || 
                          data.address.village || 
                          data.address.municipality ||
                          data.address.county;

        if (!cityFound) {
            throw new Error("Ville non identifiée");
        }

        // Trouver la correspondance la plus proche dans nos villes supportées
        const detectedCity = SUPPORTED_CITIES.find(c => 
            cityFound.toLowerCase().includes(c.toLowerCase()) || 
            c.toLowerCase().includes(cityFound.toLowerCase())
        );

        return {
            city: detectedCity || "Douala", // Fallback sur Douala si non supporté au Cameroun
            raw: data
        };
    } catch (error) {
        console.error("Reverse Geocoding Error:", error);
        throw error;
    }
}
