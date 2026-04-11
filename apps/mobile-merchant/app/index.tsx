import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function IndexScreen() {
    const { session, profile, loading } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        if (loading) return;
        if (!session) {
            router.replace('/(auth)/login');
        } else if (profile && !profile.restaurantId) {
            // Logged in but no restaurant — show a "no restaurant" screen
            router.replace('/(auth)/no-restaurant');
        } else if (profile) {
            router.replace('/(tabs)');
        }
    }, [session, profile, loading]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
            <ActivityIndicator color={theme.primary} size="large" />
        </View>
    );
}
