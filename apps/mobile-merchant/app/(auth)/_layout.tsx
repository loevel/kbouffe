import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout() {
    const { session, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!session) return; // stay on auth screens
        if (profile?.restaurantId) {
            router.replace('/(tabs)');
        } else {
            router.replace('/(auth)/no-restaurant');
        }
    }, [session, profile, loading, router]);

    return <Stack screenOptions={{ headerShown: false }} />;
}
