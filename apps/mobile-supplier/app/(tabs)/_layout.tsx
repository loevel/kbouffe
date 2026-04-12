import { Stack } from 'expo-router';
import { View } from 'react-native';
import { CustomBottomTabs } from '@/components/custom-bottom-tabs';

export default function TabsLayout() {
    return (
        <View style={{ flex: 1 }}>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="orders" />
                <Stack.Screen name="catalog" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="messages" options={{ href: null }} />
                <Stack.Screen name="products" options={{ href: null }} />
            </Stack>
            <CustomBottomTabs />
        </View>
    );
}

