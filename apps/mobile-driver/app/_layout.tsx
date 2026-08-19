import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/auth-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { useResolvedScheme } from '@/hooks/use-resolved-scheme';

function Navigation() {
    const scheme = useResolvedScheme();

    return (
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="course/[id]" />
            </Stack>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    // SettingsProvider enveloppe la navigation : useResolvedScheme lit les
    // réglages, il doit donc être rendu à l'intérieur du provider.
    return (
        <SettingsProvider>
            <AuthProvider>
                <Navigation />
            </AuthProvider>
        </SettingsProvider>
    );
}
