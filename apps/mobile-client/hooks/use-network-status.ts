import { useState, useEffect, useRef } from 'react';
import * as Network from 'expo-network';

/**
 * Intervalle de sondage de l'état réseau en millisecondes.
 * expo-network n'expose pas de listener natif — on poll toutes les 10s.
 */
const POLL_INTERVAL_MS = 10_000;

/**
 * Hook personnalisé pour surveiller la connectivité réseau.
 *
 * Retourne `isConnected: false` dès que le périphérique perd l'accès
 * au réseau (Wi-Fi ou données mobiles), et repasse à `true` à la
 * reconnexion.
 *
 * Stratégie : une vérification initiale + un sondage périodique.
 */
export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        /**
         * Interroge expo-network et met à jour l'état local.
         * En cas d'erreur de l'API (simulateur, etc.), on reste
         * sur la valeur précédente pour éviter un faux "hors-ligne".
         */
        const checkNetwork = async () => {
            try {
                const state = await Network.getNetworkStateAsync();
                // isConnected peut être null sur certaines plateformes — on fallback à true
                setIsConnected(state.isConnected ?? true);
            } catch {
                // Silencieux : on ne change pas l'état si la vérification échoue
            }
        };

        // Vérification immédiate au montage
        void checkNetwork();

        // Puis sondage périodique
        intervalRef.current = setInterval(() => {
            void checkNetwork();
        }, POLL_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    return { isConnected };
}
