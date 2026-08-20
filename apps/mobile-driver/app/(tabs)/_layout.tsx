import { Stack } from 'expo-router';
import { View } from 'react-native';
import { BottomTabs } from '@/components/bottom-tabs';

export default function TabsLayout() {
    return (
        <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="historique" />
                <Stack.Screen name="gains" />
                <Stack.Screen name="profil" />
            </Stack>
            <BottomTabs />
        </View>
    );
}
