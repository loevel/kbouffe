import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authApiFetch } from '@/lib/api';
import type { ProfilLivreur } from '@/lib/types';

/**
 * Session et profil livreur.
 *
 * Il n'y a pas d'inscription dans cette app : un livreur est ajouté à l'équipe
 * d'un restaurant depuis le tableau de bord (Équipe → Livreurs), avec le rôle
 * « driver ». L'app ne peut donc que connecter un compte existant — proposer une
 * création ici mènerait à un compte que l'API refuserait ensuite en 403.
 */

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: ProfilLivreur | null;
    /** Le compte existe mais n'est livreur d'aucun restaurant. */
    nonAutorise: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<ProfilLivreur | null>;
    setDisponible: (available: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Renvoie le profil, ou `'refuse'` si le compte n'est pas livreur. */
async function fetchProfil(): Promise<ProfilLivreur | 'refuse'> {
    const response = await authApiFetch('/api/driver/me');

    if (response.status === 403 || response.status === 404) return 'refuse';

    const payload = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
        throw new Error(payload.error ?? 'Impossible de charger le profil livreur');
    }

    return payload as ProfilLivreur;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfilLivreur | null>(null);
    const [nonAutorise, setNonAutorise] = useState(false);
    const [loading, setLoading] = useState(true);
    const annule = useRef(false);

    const appliquer = useCallback((resultat: ProfilLivreur | 'refuse') => {
        if (annule.current) return;
        if (resultat === 'refuse') {
            setProfile(null);
            setNonAutorise(true);
            return;
        }
        setProfile(resultat);
        setNonAutorise(false);
    }, []);

    const refreshProfile = useCallback(async () => {
        try {
            const resultat = await fetchProfil();
            appliquer(resultat);
            return resultat === 'refuse' ? null : resultat;
        } catch (error) {
            // Une panne réseau ne doit pas déconnecter le livreur ni le déclarer
            // non autorisé : on garde le profil déjà en mémoire.
            console.error('Rafraîchissement du profil impossible', error);
            return null;
        }
    }, [appliquer]);

    useEffect(() => {
        annule.current = false;

        const charger = async (prochaineSession: Session | null) => {
            setSession(prochaineSession);
            setUser(prochaineSession?.user ?? null);

            if (!prochaineSession?.access_token) {
                setProfile(null);
                setNonAutorise(false);
                return;
            }

            try {
                appliquer(await fetchProfil());
            } catch (error) {
                console.error('Chargement du profil livreur impossible', error);
                if (!annule.current) setProfile(null);
            }
        };

        supabase.auth.getSession().then(async ({ data: { session: initiale } }) => {
            await charger(initiale);
            if (!annule.current) setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, prochaine) => {
            if (annule.current || event === 'INITIAL_SESSION') return;

            setLoading(true);
            await charger(prochaine);
            if (!annule.current) setLoading(false);
        });

        return () => {
            annule.current = true;
            subscription.unsubscribe();
        };
    }, [appliquer]);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return {};
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setNonAutorise(false);
    }, []);

    /**
     * Bascule locale de la disponibilité : l'écran l'affiche immédiatement
     * pendant que la file d'attente se charge de la transmettre.
     */
    const setDisponible = useCallback((available: boolean) => {
        setProfile((actuel) => (actuel ? { ...actuel, available } : actuel));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                profile,
                nonAutorise,
                loading,
                signIn,
                signOut,
                refreshProfile,
                setDisponible,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
    return context;
}
