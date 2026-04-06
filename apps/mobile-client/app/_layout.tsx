import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CartProvider } from '@/contexts/cart-context';
import { AuthProvider } from '@/contexts/auth-context';
import { AppThemeProvider } from '@/contexts/theme-context';
import { OrdersProvider } from '@/contexts/orders-context';
import { RestaurantProvider } from '@/contexts/restaurant-context';
import { useOrdersRealtime } from '@/hooks/use-orders-realtime';
import { LoyaltyProvider } from '@/contexts/loyalty-context';
import { SupportProvider } from '@/contexts/support-context';

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <AppThemeProvider>
                <LayoutContent />
            </AppThemeProvider>
        </AuthProvider>
    );
}

function LayoutContent() {
    const colorScheme = useColorScheme();

    return (
        <OrdersProvider>
            <OrdersRealtimeBridge />
            <SupportProvider>
                <LoyaltyProvider>
                    <RestaurantProvider>
                        <CartProvider>
                            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                                <Stack>
                                    <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
                                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                                    <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
                                    <Stack.Screen name="restaurant/[id]/reserve" options={{ headerShown: false }} />
                                    <Stack.Screen name="product-modal" options={{ presentation: 'modal', headerShown: false }} />
                                    <Stack.Screen name="cart" options={{ presentation: 'modal', headerShown: false }} />
                                    <Stack.Screen name="checkout" options={{ headerShown: false }} />
                                    <Stack.Screen name="order-confirmation" options={{ headerShown: false }} />
                                    <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
                                    <Stack.Screen name="review/[orderId]" options={{ headerShown: false }} />
                                    <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
                                    <Stack.Screen name="profile/addresses" options={{ headerShown: false }} />
                                    <Stack.Screen name="profile/favorites" options={{ headerShown: false }} />
                                    <Stack.Screen name="profile/settings" options={{ headerShown: false }} />
                                    <Stack.Screen name="profile/loyalty" options={{ headerShown: false }} />
                                    <Stack.Screen name="support/index" options={{ headerShown: false }} />
                                    <Stack.Screen name="support/new-ticket" options={{ headerShown: false }} />
                                    <Stack.Screen name="support/tickets" options={{ headerShown: false }} />
                                    <Stack.Screen name="legal/client" options={{ headerShown: false }} />
                                </Stack>
                                <StatusBar style="auto" />
                            </ThemeProvider>
                        </CartProvider>
                    </RestaurantProvider>
                </LoyaltyProvider>
            </SupportProvider>
        </OrdersProvider>
    );
}

function OrdersRealtimeBridge() {
    useOrdersRealtime();
    return null;
}
