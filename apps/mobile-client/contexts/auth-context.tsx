import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@kbouffe/shared-types';
import { supabase } from '../lib/supabase';

import { getLoyalty } from '../lib/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (phone: string, password: string) => Promise<void>;
    register: (fullName: string, phone: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(async (supabaseUser: any) => {
        if (!supabaseUser) return null;
        
        try {
            const loyalty = await getLoyalty();
            return {
                id: supabaseUser.id,
                email: supabaseUser.email ?? null,
                phone: supabaseUser.phone ?? '',
                fullName: supabaseUser.user_metadata?.full_name ?? 'Utilisateur',
                role: 'customer',
                avatarUrl: loyalty.profile?.avatarUrl ?? null,
                createdAt: new Date(supabaseUser.created_at),
                updatedAt: new Date(supabaseUser.updated_at ?? supabaseUser.created_at),
                profile: loyalty.profile
            } as User;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Fallback to minimal user if profile fetch fails
            return {
                id: supabaseUser.id,
                email: supabaseUser.email ?? null,
                phone: supabaseUser.phone ?? '',
                fullName: supabaseUser.user_metadata?.full_name ?? 'Utilisateur',
                role: 'customer',
                avatarUrl: null,
                createdAt: new Date(supabaseUser.created_at),
                updatedAt: new Date(supabaseUser.updated_at ?? supabaseUser.created_at),
            } as User;
        }
    }, []);

    const refreshUser = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const fullUser = await fetchUserProfile(session.user);
            setUser(fullUser);
        }
    }, [fetchUserProfile]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchUserProfile(session.user).then(setUser);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const fullUser = await fetchUserProfile(session.user);
                setUser(fullUser);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchUserProfile]);

    const login = async (phone: string, password: string) => {
        const phoneFormatted = phone.startsWith('+') ? phone : `+225${phone}`;
        const { error } = await supabase.auth.signInWithPassword({
            phone: phoneFormatted,
            password,
        });
        if (error) throw error;
    };

    const register = async (fullName: string, phone: string, password: string) => {
        const phoneFormatted = phone.startsWith('+') ? phone : `+225${phone}`;
        const { error } = await supabase.auth.signUp({
            phone: phoneFormatted,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'customer',
                },
            },
        });
        if (error) throw error;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;
        
        // Update local state optimistically
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);

        // Sync with API
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/account/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                // If it fails, we might want to refresh back to the original state
                refreshUser();
                throw new Error("Erreur lors de la mise à jour du profil");
            }
        } catch (err) {
            console.error(err);
            refreshUser();
            throw err;
        }
    };

    const value = useMemo(
        () => ({ user, isAuthenticated: !!user, login, register, logout, refreshUser, updateProfile }),
        [user, refreshUser],
    );

    // Prevent rendering children until we checked if a session exists
    if (loading) return null;

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
