import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack>
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="features" options={{ headerShown: false }} />
            <Stack.Screen name="catalog" options={{ headerShown: false }} />
            <Stack.Screen name="orders" options={{ headerShown: false }} />
            <Stack.Screen name="messages" options={{ headerShown: false }} />
        </Stack>
    );
}
