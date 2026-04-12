import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';
import { useOnboarding } from '@/contexts/onboarding-context';

export default function IndexScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { session, profile, loading } = useAuth();
    const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding();

    useEffect(() => {
        if (loading || onboardingLoading) return;

        // Show onboarding if not completed
        if (!hasCompletedOnboarding) {
            router.replace('/(onboarding)/welcome');
            return;
        }

        if (!session) {
            router.replace('/(auth)/login');
            return;
        }

        if (!profile) {
            router.replace('/(auth)/register');
            return;
        }

        if (profile.kyc_status === 'approved') {
            router.replace('/(tabs)');
            return;
        }

        router.replace('/(auth)/awaiting-approval');
    }, [loading, onboardingLoading, hasCompletedOnboarding, profile, router, session]);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
            <ActivityIndicator color={theme.primary} size="large" />
        </View>
    );
}
