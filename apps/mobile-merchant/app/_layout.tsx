import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/auth-context';
import { useEffect } from 'react';
import { registerForPushNotifications, setupNotificationListeners } from '@/lib/notifications';
import 'react-native-reanimated';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        // Enregistrer pour les notifications push au montage
        registerForPushNotifications();

        // Setup les listeners pour les notifications reçues
        const unsubscribe = setupNotificationListeners();

        return () => {
            unsubscribe?.();
        };
    }, []);

    return (
        <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="settings" options={{ headerShown: false }} />
                    <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="product/new" options={{ headerShown: false }} />
                    <Stack.Screen name="message/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="reviews" options={{ headerShown: false }} />
                    <Stack.Screen name="kitchen" options={{ headerShown: false }} />
                    <Stack.Screen name="customers" options={{ headerShown: false }} />
                    <Stack.Screen name="customer/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="reservations" options={{ headerShown: false }} />
                    <Stack.Screen name="finances" options={{ headerShown: false }} />
                    <Stack.Screen name="promotions" options={{ headerShown: false }} />
                    <Stack.Screen name="loyalty" options={{ headerShown: false }} />
                    <Stack.Screen name="reports" options={{ headerShown: false }} />
                    <Stack.Screen name="team" options={{ headerShown: false }} />
                    <Stack.Screen name="caisse" options={{ headerShown: false }} />
                    <Stack.Screen name="tables" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </AuthProvider>
    );
}
