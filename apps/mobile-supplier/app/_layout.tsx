import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/auth-context';
import { OnboardingProvider } from '@/contexts/onboarding-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { useResolvedScheme } from '@/hooks/use-resolved-scheme';

export default function RootLayout() {
    const scheme = useResolvedScheme();

    return (
        <AuthProvider>
            <OnboardingProvider>
                <SettingsProvider>
                    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <Stack>
                            <Stack.Screen name="index" options={{ headerShown: false }} />
                            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
                            <Stack.Screen name="product/new" options={{ headerShown: false }} />
                            <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
                        </Stack>
                        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
                    </ThemeProvider>
                </SettingsProvider>
            </OnboardingProvider>
        </AuthProvider>
    );
}
