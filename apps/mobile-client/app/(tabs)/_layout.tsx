import { Tabs } from 'expo-router';
import React from 'react';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.tabIconDefault,
                headerShown: false,
                tabBarShowLabel: false,
            }}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
            <Tabs.Screen name="explore" options={{ title: 'Explorer' }} />
            <Tabs.Screen name="map" options={{ title: 'Carte' }} />
            <Tabs.Screen name="orders" options={{ title: 'Commandes' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        </Tabs>
    );
}
