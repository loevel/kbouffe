import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import type { SupplierProfile } from '@/lib/types';

interface RegisterAccountInput {
    fullName: string;
    email: string;
    phone: string;
    password: string;
}

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: SupplierProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<SupplierProfile | null>;
    registerAccount: (input: RegisterAccountInput) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSupplierProfile(token: string) {
    const response = await apiFetch('/api/marketplace/suppliers/me', undefined, token);

    if (response.status === 404) return null;

    const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        supplier?: SupplierProfile;
    };

    if (!response.ok) {
        throw new Error(payload.error ?? 'Impossible de charger le profil fournisseur');
    }

    return payload.supplier as SupplierProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<SupplierProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        const token = session?.access_token;
        if (!token) {
            setProfile(null);
            return null;
        }

        const nextProfile = await fetchSupplierProfile(token);
        setProfile(nextProfile);
        return nextProfile;
    }, [session?.access_token]);

    useEffect(() => {
        let cancelled = false;

        supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
            if (cancelled) return;

            setSession(initialSession);
            setUser(initialSession?.user ?? null);

            if (initialSession?.access_token) {
                try {
                    const nextProfile = await fetchSupplierProfile(initialSession.access_token);
                    if (!cancelled) setProfile(nextProfile);
                } catch (error) {
                    if (!cancelled) setProfile(null);
                    console.error('Initial profile fetch failed', error);
                }
            }

            if (!cancelled) setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
            if (cancelled || event === 'INITIAL_SESSION') return;

            setLoading(true);
            setSession(nextSession);
            setUser(nextSession?.user ?? null);

            if (nextSession?.access_token) {
                try {
                    const nextProfile = await fetchSupplierProfile(nextSession.access_token);
                    if (!cancelled) setProfile(nextProfile);
                } catch (error) {
                    if (!cancelled) setProfile(null);
                    console.error('Auth state profile refresh failed', error);
                }
            } else {
                setProfile(null);
            }

            if (!cancelled) setLoading(false);
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { error: error.message };
        }

        return {};
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setProfile(null);
    }, []);

    const registerAccount = useCallback(async (input: RegisterAccountInput) => {
        const response = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                full_name: input.fullName,
                email: input.email,
                phone: input.phone,
                password: input.password,
                role: 'supplier',
            }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
        };

        if (!response.ok) {
            return { error: payload.error ?? 'Impossible de créer le compte' };
        }

        const signInResult = await signIn(input.email, input.password);
        if (signInResult.error) {
            return signInResult;
        }

        return {};
    }, [signIn]);

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                profile,
                loading,
                signIn,
                signOut,
                refreshProfile,
                registerAccount,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}
