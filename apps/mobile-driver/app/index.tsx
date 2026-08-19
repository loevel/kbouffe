import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';

export default function IndexScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { session, profile, nonAutorise, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!session) {
            router.replace('/(auth)/login');
            return;
        }

        // Compte valide mais absent des équipes en tant que livreur : le dire,
        // plutôt que d'ouvrir une app dont chaque écran répondra 403.
        if (nonAutorise || !profile) {
            router.replace('/(auth)/acces-refuse');
            return;
        }

        router.replace('/(tabs)');
    }, [loading, session, profile, nonAutorise, router]);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
            <ActivityIndicator color={theme.primary} size="large" />
        </View>
    );
}
