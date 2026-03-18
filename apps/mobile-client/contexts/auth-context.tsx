import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@kbouffe/shared-types';
import { supabase } from '../lib/supabase';
import { getLoyalty, phoneToAuthEmail, registerCustomer, updateProfile as updateProfileRequest } from '../lib/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    register: (fullName: string, phone: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const DEFAULT_COUNTRY_CODE = process.env.EXPO_PUBLIC_DEFAULT_COUNTRY_CODE ?? '+237';

function normalizePhoneNumber(phone: string) {
    const trimmed = phone.trim();
    if (!trimmed) return trimmed;

    if (trimmed.startsWith('+')) {
        return `+${trimmed.slice(1).replace(/\D/g, '')}`;
    }

    const countryDigits = DEFAULT_COUNTRY_CODE.replace(/\D/g, '');
    const localDigits = trimmed.replace(/\D/g, '').replace(/^0+/, '');

    if (localDigits.startsWith(countryDigits)) {
        return `+${localDigits}`;
    }

    return `+${countryDigits}${localDigits}`;
}

function buildBaseUser(supabaseUser: SupabaseUser): User {
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser | null) => {
        if (!supabaseUser) return null;

        const baseUser = buildBaseUser(supabaseUser);
        
        try {
            const loyalty = await getLoyalty();
            return {
                ...baseUser,
                avatarUrl: loyalty.profile?.avatarUrl ?? null,
                profile: loyalty.profile
            } as User;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return baseUser;
        }
    }, []);

    const refreshUser = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const fullUser = await fetchUserProfile(session.user);
            setUser(fullUser);
            return;
        }
        setUser(null);
    }, [fetchUserProfile]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(buildBaseUser(session.user));
                fetchUserProfile(session.user).then(setUser);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(buildBaseUser(session.user));
                const fullUser = await fetchUserProfile(session.user);
                setUser(fullUser);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchUserProfile]);

    const login = useCallback(async (identifier: string, password: string) => {
        const trimmedIdentifier = identifier.trim();
        const attempts = trimmedIdentifier.includes('@')
            ? [{ email: trimmedIdentifier.toLowerCase() }]
            : [
                { email: phoneToAuthEmail(normalizePhoneNumber(trimmedIdentifier)) },
                { phone: normalizePhoneNumber(trimmedIdentifier) },
            ];

        let lastError: Error | null = null;

        for (const attempt of attempts) {
            const { error } = await supabase.auth.signInWithPassword({
                ...attempt,
                password,
            });

            if (!error) return;
            lastError = error;
        }

        if (lastError) throw lastError;
    }, []);

    const register = useCallback(async (fullName: string, phone: string, password: string) => {
        const phoneFormatted = normalizePhoneNumber(phone);
        await registerCustomer({
            fullName,
            phone: phoneFormatted,
            password,
        });
        await login(phoneFormatted, password);
    }, [login]);

    const logout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (!user) return;
        
        // Update local state optimistically
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);

        // Sync with API
        try {
            await updateProfileRequest({
                fullName: data.fullName,
                phone: data.phone,
                avatarUrl: data.avatarUrl,
                preferredLang: data.profile?.preferredLang,
                notificationsEnabled: data.profile?.notificationsEnabled,
                onboardingCompleted: data.profile?.onboardingCompleted,
                themePreference: data.profile?.themePreference,
            });
        } catch (err) {
            console.error(err);
            await refreshUser();
            throw err;
        }
    }, [refreshUser, user]);

    const value = useMemo(
        () => ({ user, isAuthenticated: !!user, login, register, logout, refreshUser, updateProfile }),
        [user, login, register, logout, refreshUser, updateProfile],
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
