import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { envoyerPosition } from '@/lib/driver';

/** Intervalle d'émission — assez fin pour suivre, assez lâche pour la batterie. */
const INTERVALLE_MS = 15_000;
/** En dessous, on ne renvoie rien : le client ne verra pas la différence. */
const DISTANCE_MINIMALE_M = 25;

export type EtatPosition = 'inactif' | 'demande' | 'refuse' | 'actif' | 'indisponible';

/**
 * Émet la position du livreur pendant une course, et seulement pendant.
 *
 * La permission n'est demandée qu'au moment où une course est réellement en
 * route : un livreur qui ouvre l'app pour consulter ses gains n'a aucune raison
 * de voir une demande de localisation. Le suivi s'arrête dès que `actif` repasse
 * à faux — c'est ce qui garantit qu'on ne piste pas quelqu'un hors service.
 */
export function usePositionCourse(courseId: string | null, actif: boolean) {
    const [etat, setEtat] = useState<EtatPosition>('inactif');
    const [derniere, setDerniere] = useState<{ lat: number; lng: number } | null>(null);
    const precedente = useRef<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!actif || !courseId) {
            setEtat('inactif');
            precedente.current = null;
            return;
        }

        let annule = false;
        let abonnement: Location.LocationSubscription | null = null;

        const demarrer = async () => {
            setEtat('demande');

            const services = await Location.hasServicesEnabledAsync();
            if (!services) {
                if (!annule) setEtat('indisponible');
                return;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (annule) return;

            if (status !== Location.PermissionStatus.GRANTED) {
                setEtat('refuse');
                return;
            }

            setEtat('actif');

            abonnement = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: INTERVALLE_MS,
                    distanceInterval: DISTANCE_MINIMALE_M,
                },
                (position) => {
                    if (annule) return;

                    const point = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setDerniere(point);
                    precedente.current = point;

                    // Hors ligne, la position part en file et sera rejouée. Elle
                    // n'a alors plus de valeur de suivi temps réel, mais elle
                    // laisse une trace du trajet — et ne coûte rien au livreur.
                    envoyerPosition(courseId, point.lat, point.lng).catch((error) => {
                        console.error('Position non transmise', error);
                    });
                }
            );
        };

        demarrer().catch((error) => {
            console.error('Suivi de position impossible', error);
            if (!annule) setEtat('indisponible');
        });

        return () => {
            annule = true;
            abonnement?.remove();
        };
    }, [courseId, actif]);

    return { etat, derniere };
}
