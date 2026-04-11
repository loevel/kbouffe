import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface MerchantProfile {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    role: string;
    restaurantId: string | null;
    restaurantName: string | null;
    restaurantSlug: string | null;
    memberRole: string | null; // owner, manager, cashier, cook, etc.
}

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: MerchantProfile | null;
    loading: boolean;
    signIn: (phone: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async (userId: string) => {
        // Load user + restaurant info in parallel
        const [userRes, memberRes] = await Promise.all([
            supabase.from('users').select('id, name, phone, email, role').eq('id', userId).maybeSingle(),
            supabase
                .from('restaurant_members')
                .select('restaurant_id, role, restaurants(id, name, slug)')
                .eq('user_id', userId)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle(),
        ]);

        const u = userRes.data;
        const m = memberRes.data as any;

        // Also check restaurant owned directly
        let restaurantId = m?.restaurant_id ?? null;
        let restaurantName = m?.restaurants?.name ?? null;
        let restaurantSlug = m?.restaurants?.slug ?? null;
        let memberRole = m?.role ?? null;

        if (!restaurantId) {
            const ownedRes = await supabase
                .from('restaurants')
                .select('id, name, slug')
                .eq('owner_id', userId)
                .maybeSingle();
            if (ownedRes.data) {
                restaurantId = ownedRes.data.id;
                restaurantName = ownedRes.data.name;
                restaurantSlug = ownedRes.data.slug;
                memberRole = 'owner';
            }
        }

        if (!u) return null;

        return {
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            role: u.role,
            restaurantId,
            restaurantName,
            restaurantSlug,
            memberRole,
        } as MerchantProfile;
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!user?.id) return;
        const p = await loadProfile(user.id);
        setProfile(p);
    }, [user, loadProfile]);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                const p = await loadProfile(s.user.id);
                setProfile(p);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                const p = await loadProfile(s.user.id);
                setProfile(p);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [loadProfile]);

    const signIn = async (phone: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ phone, password });
        if (error) return { error: error.message };
        return {};
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
