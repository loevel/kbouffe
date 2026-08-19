import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chargerCourses } from '@/lib/driver';
import { tailleDeLaFile, viderLaFile } from '@/lib/outbox';
import type { Course } from '@/lib/types';

const CACHE = 'driver_courses_v1';
const RAFRAICHISSEMENT_MS = 30_000;

/**
 * Les courses du livreur, avec cache local et reprise de la file d'attente.
 *
 * Le cache n'est pas un confort : sans réseau, un livreur doit toujours pouvoir
 * lire l'adresse et le téléphone du client de la course qu'il est en train de
 * faire. `horsLigne` dit à l'écran qu'il regarde une copie, pas l'état réel.
 */
export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);
    const [horsLigne, setHorsLigne] = useState(false);
    const [enAttente, setEnAttente] = useState(0);
    const monte = useRef(true);

    const rafraichir = useCallback(async (silencieux = false) => {
        if (!silencieux) setLoading(true);

        // Rejouer d'abord : sans ça, la liste réaffiche la course qu'on vient de
        // livrer hors ligne, et le livreur croit que sa validation s'est perdue.
        try {
            const { envoyees } = await viderLaFile();
            if (envoyees > 0) setHorsLigne(false);
        } catch (error) {
            console.error('Reprise de la file impossible', error);
        }

        try {
            const prochaines = await chargerCourses();
            if (!monte.current) return;
            setCourses(prochaines);
            setErreur(null);
            setHorsLigne(false);
            await AsyncStorage.setItem(CACHE, JSON.stringify(prochaines)).catch(() => {});
        } catch (error) {
            if (!monte.current) return;
            setHorsLigne(true);
            setErreur(error instanceof Error ? error.message : 'Chargement impossible.');
        } finally {
            if (monte.current) {
                setLoading(false);
                setEnAttente(await tailleDeLaFile());
            }
        }
    }, []);

    useEffect(() => {
        monte.current = true;

        // Le cache s'affiche avant même le premier appel réseau : sur une
        // connexion lente, le livreur voit sa course tout de suite.
        AsyncStorage.getItem(CACHE)
            .then((brut) => {
                if (!brut || !monte.current) return;
                setCourses(JSON.parse(brut) as Course[]);
            })
            .catch(() => {})
            .finally(() => rafraichir(true));

        const timer = setInterval(() => rafraichir(true), RAFRAICHISSEMENT_MS);

        return () => {
            monte.current = false;
            clearInterval(timer);
        };
    }, [rafraichir]);

    /** Retire une course de la liste sans attendre le prochain rafraîchissement. */
    const retirer = useCallback((courseId: string) => {
        setCourses((actuelles) => actuelles.filter((c) => c.id !== courseId));
    }, []);

    return { courses, loading, erreur, horsLigne, enAttente, rafraichir, retirer };
}
