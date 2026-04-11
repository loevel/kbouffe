import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout() {
    const router = useRouter();
    const { session, profile, loading } = useAuth();

    useEffect(() => {
        if (loading || !session) return;

        if (!profile) {
            router.replace('/(auth)/register');
            return;
        }

        if (profile.kyc_status === 'approved') {
            router.replace('/(tabs)');
            return;
        }

        router.replace('/(auth)/awaiting-approval');
    }, [loading, profile, router, session]);

    return <Stack screenOptions={{ headerShown: false }} />;
}
