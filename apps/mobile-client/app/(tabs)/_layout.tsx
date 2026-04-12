import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.tabIconDefault,
                headerShown: true,
                tabBarShowLabel: false,
                animation: 'shift',
                headerStyle: {
                    backgroundColor: theme.surfaceElevated,
                },
                headerTitleStyle: {
                    ...Typography.headline,
                    color: theme.text,
                },
                headerShadowVisible: false,
            }}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explorer',
                    headerRight: () => (
                        <HeaderMapButton theme={theme} router={router} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Commandes',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                }}
            />
            <Tabs.Screen name="favorites" options={{ href: null }} />
            <Tabs.Screen name="map" options={{ href: null }} />
        </Tabs>
    );
}

function HeaderMapButton({ theme, router }: { theme: any; router: any }) {
    return (
        <Pressable
            style={[styles.mapButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/map');
            }}
            accessibilityRole="button"
            accessibilityLabel="Voir la carte des restaurants"
        >
            <Ionicons name="map" size={20} color={theme.primary} />
            <Text style={[styles.mapButtonText, { color: theme.primary }]}>Carte</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.md,
        marginRight: Spacing.sm,
    },
    mapButtonText: {
        ...Typography.smallSemibold,
    },
});
